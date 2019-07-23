'use strict';

const formatters = require('../formatters');
const Node = require('./Node');

class Placeholder extends Node {
  constructor(node = {}) {
    super(node);
    this.type = 'placeholder';
    this.nodes = node.nodes || [];
  }

  stringify() {
    this.debug('stringify');
    let inner = this.nodes.slice(1, -1).map(n => n.stringify()).join('');
    return `\${${this.variable}:${inner}}`;
  }

  compile(options = {}) {
    let opts = { formatters, ...options };
    let format = opts.formatters[this.type] || opts.formatters.identity;
    let fns = this.precompile(options);

    return (context = {}) => {
      let state = { node: this, resolved: 'value', value: context[this.variable] };

      if (!this.isValue(state.value)) {
        state.value = fns.map(fn => fn(context)).join('');
        state.resolved = 'inner';
      }

      return format(state);
    };
  }
}

module.exports = Placeholder;
