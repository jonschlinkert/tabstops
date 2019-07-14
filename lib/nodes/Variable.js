'use strict';

const formatters = require('../formatters');
const Node = require('./Node');

class Variable extends Node {
  constructor(node = {}) {
    super(node);
    this.type = 'variable';
    this.variable = this.match[1] || this.match[2];
  }

  stringify() {
    return this.match[0];
  }

  inner() {
    return this.variable;
  }

  compile(options) {
    let fns = this.precompile(options);

    return (locals = {}) => {
      let state = { node: this, resolved: 'value', value: locals[this.variable] };

      if (!this.isValue(state.value)) {
        state.value = fns.map(fn => fn(locals)).join('');
        state.resolved = 'inner';
      }

      return formatters[this.type](state);
    };
  }
}

module.exports = Variable;
