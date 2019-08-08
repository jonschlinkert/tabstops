'use strict';

const Placeholder = require('./Placeholder');
const Text = require('./Text');

class TabstopPlaceholder extends Placeholder {
  constructor(node) {
    super(node);
    this.type = 'tabstop_placeholder';
    this.number = Number(this.match[2]);
  }

  compile(options = {}) {
    return (data = {}) => {
      let value = this.tabstops.get(this.number);
      let state = { from: 'tabstop', value };
      this.snapshot(state);

      if (!this.isValue(state.value)) {
        state.from = 'placeholder';
        state.value = this.placeholder(data, options);
        this.snapshot(state);

        if (this.hasTextPlaceholder()) {
          this.tabstops.set(this.key, this.styles.unstyle(state.value));
        }

      } else {
        this.tabstops.set(this.key, this.styles.unstyle(state.value));
      }

      return this.format(state, options);
    };
  }
}

module.exports = TabstopPlaceholder;
