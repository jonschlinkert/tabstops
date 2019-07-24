'use strict';

const Block = require('./Block');

class VariablePlaceholder extends Block {
  constructor(node) {
    super(node);
    this.type = 'variable_placeholder';
  }

  placeholder(options) {
    let fns = this.innerNodes.map(node => node.compile(options));
    return data => {
      return fns.map(fn => fn(data)).join('');
    };
  }

  compile(options) {
    let fns = this.nodes.map(node => node.compile(options));
    let placeholder = this.placeholder(options);

    return (data = {}) => {
      if (this.invalid === true) {
        return fns.map(fn => fn(data)).join('');
      }

      let state = { node: this, resolved: 'variable', value: data[this.name] };
      if (!this.isValue(state.value)) {
        state.resolved = 'placeholder';
        state.value = placeholder(data) || '';
      }

      return this.format(state, options);
    };
  }

  get name() {
    return this.nodes[0].match[1];
  }
}

module.exports = VariablePlaceholder;
