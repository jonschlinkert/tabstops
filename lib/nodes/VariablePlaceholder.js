'use strict';

const Placeholder = require('./Placeholder');

class VariablePlaceholder extends Placeholder {
  constructor(node) {
    super(node);
    this.type = 'variable_placeholder';
  }

  onClose(options) {
    super.onClose(options);

    if (!this.isValue(this.data.get(this.name))) {
      let value = this.getInitial(options);
      let init = this.initial;

      if (init && this.isValue(value)) {
        if (init.resolved !== 'name' && init.resolved !== 'placeholder') {
          this.data.set(this.name, value);
        }
      }
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

      return this.format(state, options);
    };
  }

  get name() {
    return this.nodes[0].match[1];
  }
}

module.exports = VariablePlaceholder;
