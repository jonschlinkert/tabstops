'use strict';

const Placeholder = require('./Placeholder');

class TabstopPlaceholder extends Placeholder {
  constructor(node) {
    super(node);
    this.type = 'tabstop_placeholder';
  }

  onClose(options) {
    super.onClose(options);

    if (!this.isValue(this.tabstops.get(this.number))) {
      let value = this.getInitial();
      let init = this.initial;

      if (init && this.isValue(value)) {
        if (init.resolved !== 'name' && init.type !== 'text') {
          this.tabstops.set(this.number, value);
        }
      }
    }
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
