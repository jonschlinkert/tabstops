'use strict';

const Node = require('./Node');

class Helper extends Node {
  constructor(node) {
    super(node);
    this.type = 'helper';
    this.value = this.value || this.match[0] || '';
  }

  stringify() {
    return this.value;
  }

  inner() {
    return this.value;
  }

  compile(options = {}) {
    let helpers = options.helpers || {};

    return data => {
      let [, name, args] = this.helperMatch;
      let helper = helpers[name];
      let state = { from: 'helper', value: '' };

      if (typeof helper === 'function') {
        state.value = helper.call(this, ...args.split(/,\s*/));
      }

      this.snapshot(state);
      return this.format(state, options, this.history);
    };
  }
}

module.exports = Helper;
