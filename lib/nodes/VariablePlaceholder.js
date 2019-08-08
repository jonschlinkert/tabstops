'use strict';

const Placeholder = require('./Placeholder');
const Text = require('./Text');

class VariablePlaceholder extends Placeholder {
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
      let state = this.snapshot({ from: 'variable', value });

      if (!this.isValue(state.value)) {
        state.from = 'placeholder';
        state.value = this.placeholder(data, options);
        this.snapshot(state);
      }

      if (!this.isValue(state.value) && !this.emptyPlaceholder) {
        state.from = 'name';
        state.value = this.name;
        this.snapshot(state);
      }

      return this.format(state, options, this.history);
    };
  }
}

module.exports = VariablePlaceholder;
