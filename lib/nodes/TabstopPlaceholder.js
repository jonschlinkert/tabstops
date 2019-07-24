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
    let tabstops = options.tabstops;

    return data => {
      let value = fns.map(fn => fn(data)).join('');

      if (this.invalid === true) {
        return value;
      }

      let saved = tabstops.get(this.tabstop);
      if (value !== void 0 && saved === void 0) {
        tabstops.set(this.tabstop, value);
      }
      return value;
    };
  }

  compile(options = {}) {
    let placeholder = this.placeholder(options);
    let tabstops = options.tabstops;

    return (data = {}) => {
      let value = tabstops.get(this.tabstop);
      let state = { node: this, resolved: 'tabstop', value };

      if (!this.isValue(state.value)) {
        state.resolved = 'placeholder';
        state.value = placeholder(data, tabstops) || '';
      }

      tabstops.set(this.tabstop, state.value);
      return this.format(state, options);
    };
  }

  get tabstop() {
    return Number(this.nodes[0].match[1]);
  }
}

module.exports = TabstopPlaceholder;
