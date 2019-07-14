'use strict';

const formatters = require('../formatters');
const Node = require('./Node');

class Placeholder extends Node {
  constructor(node = {}) {
    super(node);
    this.type = 'placeholder';
    this.nodes = node.nodes || [];
  }

  inner() {
    let node = this.clone();

    let keys = ['open_brace', 'close_brace'];
    node.visit(node => {
      if (keys.includes(node.type)) {
        node.value = '';
      }
    });

    node.nodes[0].value = `${this.variable}:`;
    return node.nodes.map(n => n.inner()).join('');
  }

  outer() {
    return String(this.source).slice(...this.loc.range);
  }

  stringify() {
    let inner = this.nodes.slice(1, -1).map(n => n.stringify()).join('');
    return `\${${this.variable}:${inner}}`;
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

module.exports = Placeholder;
