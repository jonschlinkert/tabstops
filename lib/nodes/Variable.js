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
    let opts = { formatters, ...options };
    let format = opts.formatters[this.type] || opts.formatters.identity;
    let fns = this.precompile(options);

    return (context = {}) => {
      let state = { node: this, resolved: 'value', value: context[this.variable] };

      if (!this.isValue(state.value)) {
        state.value = fns.map(fn => fn(context)).join('');
        state.resolved = 'inner';
      }

      if (!this.isValue(state.value)) {
        state.value = this.variable;
        state.resolved = 'variable_name';
      }

      return format(state);
    };
  }
}

module.exports = Variable;
