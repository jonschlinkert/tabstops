'use strict';

const Block = require('./Block');

class VariablePlaceholder extends Block {
  constructor(node) {
    super(node);
    this.type = 'variable_placeholder';
    this.name = this.match[2];
  }

  compile(options) {
    let fns = this.nodes.map(node => node.compile(options));

    return (data = {}) => {
      if (this.invalid === true) {
        return fns.map(fn => fn(data)).join('');
      }

      let value = this.resolve(data, this.name);
      let state = { resolved: 'variable', value };

      if ((this.initial && this.initial.value === state.value) || !this.isValue(state.value)) {
        state.resolved = 'placeholder';
        state.value = this.placeholder(data, options) || '';
      }

      return this.format(state, options);
    };
  }
}

module.exports = VariablePlaceholder;
