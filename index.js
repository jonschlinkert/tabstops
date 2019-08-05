'use strict';

const Events = require('events');
const colors = require('ansi-colors');
const Parser = require('./lib/Parser');
const utils = require('./lib/utils');

class Session extends Events {
  constructor(string, options) {
    super();
    this.options = options || {};
    this.snippet = new Parser(string, options);
    this.firsts = [];
    this.items = [];

    this.hidden = new Set([].concat(this.options.hidden || []));
    this.readonly = new Set([].concat(this.options.readonly || []));

    this.fields = this.snippet.fields;
    this.variables = this.snippet.values.variable;
    this.tabstops = this.snippet.values.tabstop;
    this.display = this.options.display;

    this.lines = string.split('\n');
    this.range = [0, this.lines.length];
    let vis = this.options.visible || this.lines.length;
    this.visible = Math.min(vis, this.lines.length);
    this.linemap = [];

    this.itemIndex = 0;
    this.offset = 0;
    this.cursor = 0;
    this.index = 0;
    this.mode = 0;

    if (this.options.actions) {
      for (let key of Object.keys(this.options.actions)) {
        this[key] = this.options.actions[key].bind(this);
      }
    }

    if (this.options.decorate) {
      this.snippet.on('field', item => {
        item.cursor = 0;
        item.input = '';
        item.output = '';
        item.format = this.format(item);
        item.items = this.items;
        this.emit('field', item);
      });
    }
  }

  format(item) {
    return (state, history) => {
      let output = state.value;

      if (!item.isValue(output)) {
        output = item.input;
      }

      let fields = this.options.fields || {};
      let field = fields[item.key] || fields[item.type];

      if (typeof field === 'function') {
        output = field.call(item, output, this);
      }

      if (item.type === 'checkbox' || item.type === 'radio') {
        return item.print(this.focused === item);
      }

      if (item.type === 'static') {
        return item.print(this);
      }

      if (!this.closed && this.mode > 0 && this.mode < 4) {
        return this.showPlaceholders(item, output);
      }

      if (this.hidden.has(item.key) && item.occurrence === 1) {
        return ''
      }

      if (this.closed) {
        let { value, from } = state;
        let { name, emptyPlaceholder } = item;

        if (from === 'name' && emptyPlaceholder && name === value) {
          return '';
        }

        return output;
      }

      if (this.mode === 4) {
        return output;
      }

      let style = item.kind === 'tabstop'
        ? item.styles.unstyle.green
        : item.styles.unstyle.cyan;

      if (this.focused === item) {
        style = style.bold.underline;
      }

      if (item.type === 'choices') {
        return '\b' + colors.dim('⬍') + style(output);
      }

      if (this.focused === item) {
        if (output === '') {
          return colors.bgCyan(' ');
        }

        if (item.cursor === output.length) {
          output = style(output.slice(0, output.length - 1)) + colors.bgCyan.black(output.slice(-1));
          return output
        }
      }

      return style(output);
    };
  }

  first() {
    this.index = 0;
    return this.render();
  }

  last() {
    this.index = this.firsts.length - 1;
  }

  prev() {
    this.index = (this.index - (1 % this.length) + this.length) % this.length;
  }

  next() {
    this.index = (this.index + 1) % this.length;
  }

  left() {
    this.focused.cursor = Math.max(0, this.focused.cursor - 1);;
    this.cursor = this.focused.cursor;
  }
  right() {
    let item = this.focused;
    item.cursor = Math.min(item.cursor + 1, item.input.length);
    this.cursor = item.cursor;
  }

  up() {
    let item = this.focused;
    item.cursor = (item.cursor - (1 % item.size) + item.size) % item.size;
    this.itemIndex = item.cursor;
  }

  down() {
    let item = this.focused;
    item.cursor = (item.cursor + 1) % item.size;
    this.itemIndex = item.cursor;
  }

  shiftup() {
    this.offset = (this.offset + 1) % this.llen;
  }

  shiftdown() {
    this.offset = -(-this.offset + 1) % this.llen;
  }

  pageup() {
    this.visible = Math.max(this.visible - 1, 3);
  }

  pagedown() {
    this.visible = Math.min(this.visible + 1, this.lines.length);
  }

  addItems() {
    let { tabstop, variable, zero } = this.snippet.fields;

    this.pushFields(utils.sortMap(tabstop));
    this.pushFields(variable);

    if (zero) {
      this.firsts.push(zero);
      this.items.push(zero);
    }

    this.linemap = new Map();
    this.linenos = [];

    this.lines.forEach((e, i) => {
      let lines = [];
      this.linemap.set(i, lines);
      this.linenos.push(lines);

      for (let field of this.firsts) {
        if (field.loc.lines.includes(i)) {
          lines.push(field);
        }
      }
    });
  }

  pushFields(map) {
    let occurrences = new Map();

    const count = (map, node) => {
      let n = (map.get(node.key) || 0) + 1;
      map.set(node.key, n);
      return n;
    };

    for (let [, nodes] of map) {
      let hasFirst = false;

      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        let n = count(occurrences, node.key);
        Reflect.defineProperty(node, 'occurrence', { value: n });

        if (node.type === 'static' || this.readonly.has(node.key)) {
          continue;
        }

        if (!hasFirst && node.parent && node.parent.type === 'root') {
          hasFirst = true;
          this.firsts.push(node);
        }
      }

      this.items.push(...nodes);
    }
  }

  parse(...args) {
    delete this.fn;
    this.ast = this.snippet.parse();
    this.addItems();
    return this.ast;
  }

  compile(options) {
    if (!this.fn) {
      let ast = this.parse();
      this.fn = ast.compile({ ...this.options, ...options });
    }
    return this.fn;
  }

  render(data, options) {
    this.fn = this.compile(options);
    let output = this.fn(data);
    let lines = output.split('\n');

    if (this.offset !== 0) {
      lines = this.recalculate(lines);
    }

    // if (!this.cursorIsVisible()) {
    //   this.shiftdown();
    //   return this.render(data);
    // }

    let visible = lines.slice(0, this.visible);
    return visible.join('\n');
  }

  renderResult(data) {
    this.closed = true;
    this.visible = this.lines.length;
    this.offset = 0;
    this.mode = 0;
    // return this.render(data) + '\n[' + this.line + ']';
    return this.render(data);
  }

  recalculate(lines) {
    let { linenos, offset } = this;
    this.linenos = [...linenos.slice(-offset), ...linenos.slice(0, -offset)];
    return [...lines.slice(-offset), ...lines.slice(0, -offset)];
  }

  cursorIsVisible() {
    for (let line of this.linenos.slice(0, this.visible)) {
      if (line.includes(this.focused)) {
        return true;
      }
    }
    return false;
  }

  resetLines() {
    this.offset = 0;
    this.visible = Math.min(Math.max(this.options.visible, 0), this.lines.length);
  }

  togglePlaceholders() {
    this.mode = this.mode < 4 ? this.mode + 1 : 0;
  }

  showPlaceholders(item, value) {
    let style = colors[item.kind === 'tabstop' ? 'blue' : 'green'];
    if (item.type === 'choices') {
      style = colors.yellow;
    }

    if (this.mode === 1 && item.kind === 'tabstop') {
      return style(item.stringify());
    }

    if (this.mode === 2 && item.kind === 'variable') {
      return style(item.stringify());
    }

    if (this.mode === 3) {
      return style(item.stringify());
    }

    if (this.mode === 4) {
      return item.stringify();
    }

    return value;
  }

  get values() {
    return this.focused.kind === 'tabstop' ? this.tabstops : this.variables;
  }

  get line() {
    return utils.slice(this.lines, ...this.focused.loc.lines);
  }

  get llen() {
    return this.lines.length;
  }

  get focused() {
    return this.firsts[this.index];
  }

  get length() {
    return this.firsts.length;
  }

  static get Session() {
    return Session;
  }

  static get Parser() {
    return Parser;
  }
}

module.exports = Session;
