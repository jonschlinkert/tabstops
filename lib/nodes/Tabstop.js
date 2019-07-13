'use strict';

const kTabstop = Symbol('Tabstop');
const formatters = require('../formatters');
const Node = require('./Node');
const { assertNumber } = require('../utils');

class Tabstop extends Node {
  constructor(node = {}) {
    super(node);
    this.type = 'tabstop';
    this.tabstop = Number(this.match[2] || this.match[1]);
  }

  stringify(...args) {
    return `$${this.tabstop}:${super.stringify(...args)}`;
  }

  compile(options = {}) {
    let { tabstops = new Map() } = options;
    let fns = this.precompile(options);

    return (locals = {}) => {
      let state = { node: this, resolved: 'tabstop', value: tabstops.get(this.tabstop) };

      if (!this.isValue(state.value) && this.nodes) {
        state.resolved = 'inner';
        state.value = fns.map(fn => fn(locals)).join('');
      }

      if (!this.isValue(state.value) && this.placeholder) {
        state.resolved = 'placeholder';
        state.value = this.placeholder;
      }

      if (!this.isValue(state.value)) {
        state.resolved = 'value';
        state.value = '';
      }

      this.history.push({ ...state, node: this.clone() });
      return formatters[this.type](state);
    };
  }

  set tabstop(value) {
    assertNumber(value, `Expected tabstop: "${value}" to be a number.`);
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
