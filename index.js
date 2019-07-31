'use strict';

const Events = require('events');
const colors = require('ansi-colors');
const Parser = require('./lib/Parser');

const sortMap = map => {
  const newMap = new Map();
  const keys = [...map.keys()];
  keys.sort((a, b) => (String(a).localeCompare(String(b))));
  for (let key of keys) {
    newMap.set(key, map.get(key));
  }
  return newMap;
};

const slice = (lines, start, end) => {
  return start === end ? lines[start] : lines.slice(start, end);
};

class Session extends Events {
  constructor(string, options) {
    super();
    this.options = options || {};
    this.snippet = new Parser(string, options);

    // The first array "$1" is used for storing the first
    // instance of a given tabstop, since repeated tabstops
    // are mirrors of the first.
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
        this.emit('field', item);
      });
    }
  }

  format(item) {
    return (state, history) => {
      let output = state.value;

      if (item.type === 'checkbox') {
        let { indicator, message } = state;
        if (item === this.focused) {
          message = colors.underline(message);
        }
        return `${indicator} ${message}`;
      }

      if (!item.isValue(output)) {
        output = item.input;
      }

      if (!this.closed && this.mode > 0 && this.mode < 4) {
        return this.showPlaceholders(item, output);
      }

      let fields = this.options.fields || {};
      let field = fields[item.key];

      if (typeof field === 'function') {
        output = field.call(item, output, this);
      }

      if (this.hidden.has(item.key) && item.occurrence === 1) {
        return ''
      }

      if (this.closed) {
        let { value, resolved } = state;
        let { name, emptyPlaceholder } = item;

        if (resolved === 'name' && emptyPlaceholder && name === value) {
          return '';
        }

        return output;
      }

      if (this.mode === 4) {
        return output;
      }

      let style = item.kind === 'tabstop'
        ? colors.unstyle.green
        : colors.unstyle.cyan;

      if (this.focused === item) {
        style = style.bold.underline;
      }

      if (item.type === 'choices') {
        // return colors.dim('⬍') + style(output);
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
    this.cursor--;
  }
  right() {
    this.cursor++;
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

    this.pushFields(sortMap(tabstop));
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

    for (let [, nodes] of map) {
      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        let count = (occurrences.has(node.key) || 0) + 1;
        occurrences.set(node.key, count);

        Reflect.defineProperty(node, 'occurrence', { value: count });

        if (this.readonly.has(node.key)) {
          continue;
        }

        if (node.parent && node.parent.type === 'root') {
          this.firsts.push(node);
          break;
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
    return slice(this.lines, ...this.focused.loc.lines);
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
