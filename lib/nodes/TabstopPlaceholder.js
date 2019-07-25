'use strict';

const Block = require('./Block');

class TabstopPlaceholder extends Block {
  constructor(node) {
    super(node);
    this.type = 'tabstop_placeholder';
    this.number = Number(this.match[2]);
  }

  compile(options = {}) {
    return (data = {}) => {
      let value = this.stops.get(this.number);
      let state = { resolved: 'tabstop', value };

      if (!this.isValue(state.value)) {
        state.resolved = 'placeholder';
        state.value = this.placeholder(data, options);
      }

      this.stops.set(this.number, state.value);
      return this.format(state, options);
    };
  }
}

module.exports = TabstopPlaceholder;
