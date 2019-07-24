'use strict';

const Node = require('./Node');

class Variable extends Node {
  constructor(node) {
    super(node);
    this.type = 'variable';
    this.name = this.match[2] || this.match[1] || this.match[0];
  }

  inner() {
    return this.name;
  }

  compile(options) {
    return (data = {}) => {
      let state = { node: this, resolved: 'variable', value: data[this.name] };

      if (!this.isValue(state.value)) {
        state.resolved = 'name';
        state.value = this.name;
      }

      return this.format(state, options);
    }
  }
}

module.exports = Variable;
