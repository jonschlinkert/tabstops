'use strict';

const kPlaceholder = Symbol('Placeholder');
const kTabstop = Symbol('Tabstop');
const formatters = require('../formatters');
const utils = require('../utils');
const Node = require('./Node');

class Tabstop extends Node {
  constructor(node = {}) {
    super(node);
    this.type = 'tabstop';
    this.tabstops = this.tabstops || new Map();
    this.tabstop = Number(this.match[2] || this.match[1]);
  }

  inner() {
    let output = '' + this.tabstop;

    if (this.nodes) {
      let nodes = this.nodes.filter(n => n !== this.openNode && n !== this.closeNode);
      output += ':' + nodes.map(n => n.toString()).join('');
    }

    return output;
  }

  // toSnippet() {
  //   return `\${${this.stringify()}}`;
  // }

  // stringify() {
  //   this.debug('stringify');

  //   if (this.nodes) {
  //     let inner = this.nodes.slice(1, -1).map(n => n.stringify()).join('');
  //     return `\${${this.tabstop}:${inner}}`;
  //   }
  //   return this.match[0];
  // }

  compile(options = {}) {
    let opts = { formatters, tabstops: this.tabstops, ...options };
    let format = opts.formatters[this.type] || opts.formatters.identity;

    return (context = {}) => {
      let state = { node: this, resolved: 'tabstop', value: opts.tabstops.get(this.tabstop) };

      if (!this.isValue(state.value) && this.nodes) {
        state.resolved = 'placeholder';
        state.value = this.placeholder;
      }

      if (!this.isValue(state.value)) {
        state.resolved = 'value';
        state.value = '';
      }

      return format(state);
    };
  }

  set placeholder(value) {
    this[kPlaceholder] = value;
  }
  get placeholder() {
    if (this[kPlaceholder] === void 0) {
      let fns = this.precompile();
      this[kPlaceholder] = fns.map(fn => fn(context)).join('');
    }
    return this[kPlaceholder];
  }

  set tabstop(value) {
    utils.assertNumber(value, `Expected tabstop: "${value}" to be a number.`);
    this[kTabstop] = Number(value);
  }
  get tabstop() {
    if (typeof this[kTabstop] !== 'number' && Number.isInteger(+this.value)) {
      this[kTabstop] = Number(this.value);
    }
    return this[kTabstop];
  }
}

module.exports = Tabstop;
