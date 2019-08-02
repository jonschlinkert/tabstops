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
      let state = { from: this.type, value };
      this.snapshot(state);

      if (this.isValue(state.value)) {
        let block = this.ancestor('choices');
        if (block) {
          block.choicesMap.set(block.getIndex(this), { name: this.name, value });
        }
      }

      if (!this.isValue(state.value)) {
        state.from = 'name';
        state.value = this.name;
        this.snapshot(state);
      }

      return this.format(state, options, this.history);
    };
  }
}

module.exports = Variable;
