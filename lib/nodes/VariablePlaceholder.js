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
      let state = { resolved: 'variable', value };

      if (!this.isValue(state.value)) {
        state.resolved = 'placeholder';
        state.value = this.placeholder(data, options) || '';
      }

      if (!this.isValue(state.value)) {
        state.resolved = 'name';
        state.value = this.name;
      }

      return this.format(state, options);
    };
  }
}

module.exports = VariablePlaceholder;
