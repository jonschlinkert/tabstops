'use strict';

const Block = require('./Block');

class Placeholder extends Block {
  getInitial(options = {}) {
    if (this.initial) return this.initial;
    this.initial = {};

    let initial = (state, history) => {
      state.initial = true;

      if (typeof options.format === 'function') {
        state.value = options.format(state, history);
      }

      this.initial = state;
      return state.value;
    };

    return this.placeholder(void 0, { format: initial });
  }

  placeholder(data, options) {
    let fns = this.innerNodes.map(node => node.compile(options));
    return fns.map(fn => fn(data)).join('');
  }
}

module.exports = Placeholder;
