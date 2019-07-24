'use strict';

const Block = require('./Block');

class TabstopPlaceholder extends Block {
  constructor(node) {
    super(node);
    this.type = 'tabstop_placeholder';
  }

  onClose(options) {
    super.onClose(options);

    if (this.fields) {
      let field = this.fields.get(this.tabstop) || [];
      this.fields.set(this.tabstop, field.concat(this));
    }
  }

  placeholder(options = {}) {
    let fns = this.innerNodes.map(node => node.compile(options));
    return data => {
      return fns.map(fn => fn(data)).join('');
    };
  }

  compile(options = {}) {
    let placeholder = this.placeholder(options);

    return (data = {}) => {
      let value = this.tabstops.get(this.tabstop);
      let state = { node: this, resolved: 'tabstop', value };

      if (!this.isValue(state.value)) {
        state.resolved = 'placeholder';
        state.value = placeholder(data, this.tabstops);
      }

      let saved = this.tabstops.get(this.tabstop);
      if (state.value !== void 0 && saved === void 0) {
        this.tabstops.set(this.tabstop, state.value);
      }

      return this.format(state, options);
    };
  }

  get tabstop() {
    return Number(this.nodes[0].match[1]);
  }
}

module.exports = TabstopPlaceholder;
