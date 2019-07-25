'use strict';

const Block = require('./Block');

class VariablePlaceholder extends Block {
  constructor(node) {
    super(node);
    this.type = 'variable_placeholder';
  }

  onClose(options) {
    super.onClose(options);

    if (!this.isValue(this.data.get(this.name))) {
      let format = state => {
        this.initial = state;
        return state.value;
      };

      let value = this.placeholder(void 0, { format });
      let res = this.initial.resolved;

      if (res !== 'name' && res !== 'placeholder' && this.isValue(value)) {
        this.data.set(this.name, value);
      }
    }
  }

  placeholder(data, options) {
    let fns = this.innerNodes.map(node => node.compile(options));
    return fns.map(fn => fn(data)).join('');
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

      return this.format(state, options);
    };
  }

  get name() {
    return this.nodes[0].match[1];
  }
}

module.exports = VariablePlaceholder;
