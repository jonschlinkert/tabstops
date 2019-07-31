'use strict';

const Node = require('./Node');

class Variable extends Node {
  constructor(node) {
    super(node);
    this.type = 'variable';
    this.name = this.match[3] || this.match[1] || this.match[0];
  }

  inner() {
    return this.name;
  }

  compile(options = {}) {
    return data => {
      let value = this.resolve([options.data, data], this.name);
      let state = { resolved: 'variable', value };

      if (this.isValue(state.value)) {
        let block = this.ancestor('choices');
        if (block) {
          block.choicesMap.set(block.getIndex(this), { name: this.name, value });
        }
      }

      if (!this.isValue(state.value)) {
        state.resolved = 'name';
        state.value = this.name;
      }

      return this.format(state, options);
    };
  }
}

module.exports = Variable;
