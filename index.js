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

class Session extends Events {
  constructor(string, options) {
    super();
    this.options = { ...options };
    this.snippet = new Parser(string, options);
    this.firsts = [];
    this.items = [];
    this.index = 0;
    this.display = 0;

    this.fields = this.snippet.fields;
    this.variables = this.snippet.values.variable;
    this.tabstops = this.snippet.values.tabstop;

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

      if (!item.isValue(output)) {
        output = item.input;
      }

      if (this.display > 0 && this.display < 4) {
        return this.showPlaceholders(item, output);
      }

      let fields = this.options.fields || {};
      let field = fields[item.key];

      if (typeof field === 'function') {
        output = field(output);
      }

      if (this.closed) {
        let { value, resolved } = state;
        let { name, emptyPlaceholder } = item;

        if (resolved === 'name' && emptyPlaceholder && name === value) {
          return '';
        }

        return output;
      }

      let style = item.kind === 'tabstop'
        ? colors.unstyle.green
        : colors.unstyle.cyan;

      if (this.focused === item) {
        style = style.bold.underline;
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
    this.prev();
  }
  down() {
    this.next();
  }

  pushFields(map) {
    for (let [, nodes] of map) {
      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (node.parent && node.parent.type === 'root') {
          this.firsts.push(node);
          break;
        }
      }
      this.items.push(...nodes);
    }
  }

  addItems() {
    let { tabstop, variable, zero } = this.snippet.fields;

    this.pushFields(sortMap(tabstop));
    this.pushFields(variable);

    if (zero) {
      this.firsts.push(zero);
      this.items.push(zero);
    }
  }

  parse(...args) {
    delete this.fn;
    this.ast = this.snippet.parse();
    this.addItems();
    return this.ast;
  }

  compile() {
    if (!this.fn) {
      let ast = this.parse();
      this.fn = ast.compile(this.options);
    }
    return this.fn;
  }

  render(data) {
    this.fn = this.compile();
    return this.fn(data);
  }

  togglePlaceholders() {
    this.display = this.display < 3 ? this.display + 1 : 0;
  }

  showPlaceholders(item, value) {
    let style = colors[item.kind === 'tabstop' ? 'blue' : 'green'];

    if (this.display === 1 && item.kind === 'tabstop') {
      return style(item.stringify());
    }

    if (this.display === 2 && item.kind === 'variable') {
      return style(item.stringify());
    }

    if (this.display === 3) {
      return style(item.stringify());
    }

    return value;
  }

  get values() {
    return this.focused.kind === 'tabstop' ? this.tabstops : this.variables;
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
