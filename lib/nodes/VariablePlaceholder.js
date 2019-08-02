'use strict';

const Block = require('./Block');
const Text = require('./Text');

class VariablePlaceholder extends Block {
  constructor(node) {
    super(node);
    this.type = 'variable_placeholder';
    this.name = this.match[2];
  }

  onClose(options) {
    super.onClose(options);
    if (this.nodes.length === 2 && this.openNode && this.closeNode) {
      this.nodes.splice(1, 0, new Text({ match: [''] }));
      this.emptyPlaceholder = true;
    }
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

      if (!this.isValue(state.value)) {
        state.from = 'name';
        state.value = this.name;
        this.snapshot(state);
      }

      return this.format(state, options, this.history);
    };
  }
}

module.exports = VariablePlaceholder;
