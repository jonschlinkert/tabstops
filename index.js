'use strict';

const Events = require('events');
const colors = require('ansi-colors');
const Parser = require('./lib/Parser');
const utils = require('./lib/utils');

const bind = (target, provider = {}) => {
  for (let key of Object.keys(provider)) {
    target[key] = provider[key].bind(target);
  }
};

const field = (key, options = {}) => {
  let identity = state => state.value;
  let value = options[key];
  let defaults = { format: identity, results: identity, validate: () => true };
  if (typeof value === 'function') {
    value = { format: value };
  }
  return { ...defaults, ...value };
};

const actions = {
  up(item) {
    item.cursor = (item.cursor - (1 % item.size) + item.size) % item.size;
  },
  down(item) {
    item.cursor = (item.cursor + 1) % item.size;
  },

  prev(item) {
    item.index = (item.index - (1 % item.length) + item.length) % item.length;
  },
  next(item) {
    item.index = (item.index + 1) % item.length;
  },

  // cycle(item) {
  //   item.index = (item.index + 1) % item.length;
  // },

  prevGroup(session) {
    let keys = [...session.groups.keys()];
    let key = session.groupKey || keys[0];
    let idx = keys.indexOf(key) - 1;
    if (idx < 0) idx = keys.length - 1;
    session.groupKey = keys[idx];
    session.focus(session.group.focused);
  },
  nextGroup(session) {
    let keys = [...session.groups.keys()];
    let key = session.groupKey || keys[0];
    let idx = keys.indexOf(key) + 1;
    if (idx === keys.length) idx = 0;
    session.groupKey = keys[idx];
    session.focus(session.group.focused);
  }
};

class Session extends Events {
  constructor(string, options) {
    super();
    this.options = options || {};
    this.parser = new Parser(string, options);

    this.hidden = new Set([].concat(this.options.hidden || []));
    this.readonly = new Set([].concat(this.options.readonly || []));

    this.lines = string.split('\n');
    this.range = [0, this.lines.length];
    this.visible = Math.min(this.options.visible || this.lines.length, this.lines.length);

    this.fields = new Map();
    this.groups = new Map();
    this.groupKey = null;
    this.index = 0;
    this.mode = 0;
    this.offset = 0;
    this.linemap = [];
    this.firsts = [];
    this.items = [];

    this.state = {
      index: 0,
      line: 0,
      mode: 0,
      offset: 0
    };

    if (this.options.decorate) {
      this.parser.on('field', item => this.decorate(item));
    }

    bind(this, this.options.actions);
  }

  decorate(item) {
    let fields = this.options.fields;

    if (!this.fields.has(item.key)) {
      this.fields.set(item.key, field(item.key, fields));
    }
    if (fields && fields[item.type] && !this.fields.has(item.type)) {
      this.fields.set(item.type, fields && fields[item.type]);
    }

    item.cursor = 0;
    item.input = '';
    item.output = '';
    item.items = this.items;
    item.session = this;
    item.format = (...args) => this.format(item, ...args);
    this.emit('field', item);
  }

  format(item, state, history) {
    let type = this.fields.get(item.type);
    let field = this.fields.get(item.key);
    let { from, value } = state;

    state.value = [state.value, item.input].find(v => item.isValue(v));
    state.from = 'format';
    state = item.snapshot(state);

    if (type) {
      state.value = type.call(item, state, this);
    }

    state.value = field.format.call(item, state, this);

    if (this.options.format) {
      return this.options.format.call(item, state, this);
    }

    if (item.type === 'radio' && item.group && item.enabled) {
      state.value = colors.cyan(state.value);
    }

    // field.format(output);

    // let fields = this.options.fields || {};
    // let field = fields[item.key] || fields[item.type];

    // if (typeof field === 'function') {
    //   output = field.call(item, output, this);
    // }

    // if (this.options.format) {
    //   return this.options.format.call(this, output, item, state, history);
    // }

    // if (item === this.focused && (state.from === 'tabstop' || state.from === 'variable')) {


    if (from.endsWith('placeholder') && state.value === value) {
      state.value = colors.dim(state.value);
    } else if (item === this.focused) {
      // output = colors.underline(output);
      state.value = colors.cyan(state.value);
    }

    return state.value;

    // if (item.type === 'checkbox' || item.type === 'radio') {
    //   return item.print(this.focused === item);
    // }

    // if (item.type === 'static') {
    //   return item.print(this);
    // }

    // if (!this.closed && this.mode > 0 && this.mode < 4) {
    //   return this.showPlaceholders(item, output);
    // }

    // if (this.hidden.has(item.key) && item.occurrence === 1) {
    //   return ''
    // }

    // if (this.closed) {
    //   let { value, from } = state;
    //   let { name, emptyPlaceholder } = item;

    //   if (from === 'name' && emptyPlaceholder && name === value) {
    //     return '';
    //   }

    //   return output;
    // }

    // if (this.mode === 4) {
    //   return output;
    // }

    // let style = item.kind === 'tabstop'
    //   ? item.styles.unstyle.green
    //   : item.styles.unstyle.cyan;

    // if (this.focused === item) {
    //   style = style.bold.underline;
    // }

    // if (item.type === 'choices') {
    //   return '\b' + colors.dim('⬍') + style(output);
    // }

    // if (this.focused === item) {
    //   if (output === '') {
    //     return colors.bgCyan(' ');
    //   }

    //   if (item.cursor === output.length) {
    //     output = style(output.slice(0, output.length - 1)) + colors.bgCyan.black(output.slice(-1));
    //     return output
    //   }
    // }

    // return style(output);
  }

  dispatch(input, event) {
    if (this.focused[event.name]) {
      this.focused[event.name](input, event, this);
    } else if (this[event.name]) {
      this[event.name](input, event);
    }
    return this.render();
  }

  append(input) {
    let item = this.focused;
    item.input += input;
    item.cursor += input.length;
    this.values.set(item.key, colors.unstyle(item.input));
  }

  delete() {
    let item = this.focused;
    item.input = item.input.slice(0, -1);
    item.cursor--;
    this.values.set(item.key, colors.unstyle(item.input));
  }

  first() {
    this.index = 0;
  }

  last() {
    this.index = this.firsts.length - 1;
  }

  up() {
    // let item = this.focused;
    // item.cursor = (item.cursor - (1 % item.size) + item.size) % item.size;
    this.prev();
  }

  down() {
    this.next();
    // let item = this.focused;
    // item.cursor = (item.cursor + 1) % item.size;
  }

  // up() {
  //   if (this.focused.group) {
  //     actions.prev(this.group);
  //     this.focus(this.group.focused);
  //     this.group.focused.enable();
  //   } else {
  //     actions.up(this.focused);
  //   }
  // }

  // down() {
  //   if (this.focused.group) {
  //     actions.next(this.group);
  //     this.focus(this.group.focused);
  //     this.group.focused.enable();
  //   } else {
  //     actions.down(this.focused);
  //   }
  // }

  prev() {
    // if (this.focused.group) {
    //   actions.prevGroup(this);
    //   // actions.up(this.focused);
    // } else {
    //   actions.prev(this);
    // }
    // actions.prev(this);
    this.index = (this.index - (1 % this.length) + this.length) % this.length;
  }

  next() {
    // if (this.focused.group) {
    //   actions.nextGroup(this);
    //   // actions.down(this.focused);
    // } else {
    //   actions.next(this);
    // }
    // actions.next(this);
    this.index = (this.index + 1) % this.length;
  }

  left() {
    this.focused.cursor = Math.max(0, this.focused.cursor - 1);;
  }

  right() {
    let item = this.focused;
    item.cursor = Math.min(item.cursor + 1, item.input.length);
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
    let { tabstop, variable, zero } = this.parser.fields;

    this.pushFields(utils.sortMap(tabstop));
    this.pushFields(variable);

    if (zero) {
      zero.readonly = true;
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

        if (node.group) {
          if (!this.groups.size) {
            this.groupKey = node.group;
          }
          let group = this.groups.get(node.group);
          if (!group) {
            group = {
              items: [],
              index: 0,
              focus(value) {
                this.index = this.items.findIndex(n => n === value || n.key === value);
                this.focused.enable();
              },
              get length() {
                return this.items.length;
              },
              get focused() {
                return this.items[this.index];
              }
            };

            this.groups.set(node.group, group);
          }
          group.items.push(node);
        }

        if (node.type === 'static') {
          this.decorate(node);
          continue;
        }
        if (this.readonly.has(node.key)) {
          this.decorate(node);
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
    this.ast = this.parser.parse();
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

  tabstop(n, value) {
    if (value === void 0) {
      return this.parser.tabstops.get(n);
    }
    this.parser.tabstops.set(n, value);
    return value;
  }

  variable(name, value) {
    if (value === void 0) {
      return this.parser.variables.get(name);
    }
    this.parser.variables.set(name, value);
    return value;
  }

  focus(value) {
    this.index = this.firsts.findIndex(n => n === value || n.key === value);
  }

  get group() {
    return this.groups.get(this.groupKey);
  }

  get values() {
    return this.focused.kind === 'tabstop' ? this.parser.tabstops : this.parser.variables;
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
