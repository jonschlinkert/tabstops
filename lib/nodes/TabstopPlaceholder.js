'use strict';

const Block = require('./Block');

class TabstopPlaceholder extends Block {
  constructor(node) {
    super(node);
    this.type = 'tabstop_placeholder';
  }

  onClose(options) {
    super.onClose(options);

    if (!this.isValue(this.tabstops.get(this.number))) {
      let format = state => {
        this.initial = state;
        return state.value;
      };

      let value = this.placeholder(void 0, { format });

      if (this.initial.resolved !== 'name' && this.isValue(value)) {
        this.tabstops.set(this.number, value);
      }
    }

    if (this.fields) {
      let field = this.fields.get(this.number) || [];
      this.fields.set(this.number, field.concat(this));
    }
  }

  placeholder(data, options) {
    let fns = this.innerNodes.map(node => node.compile(options));
    return fns.map(fn => fn(data)).join('');
  }

  compile(options = {}) {
    return (data = {}) => {
      let value = this.tabstops.get(this.number);
      let state = { resolved: 'tabstop', value };

      if (!this.isValue(state.value)) {
        state.resolved = 'placeholder';
        state.value = this.placeholder(data, options);
      }

      this.tabstops.set(this.number, state.value);
      return this.format(state, options);
    };
  }

  get number() {
    return Number(this.nodes[0].match[1]);
  }
}

module.exports = TabstopPlaceholder;
