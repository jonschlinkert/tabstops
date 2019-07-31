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
      if (typeof helper === 'function') {
        return helper.call(this, ...args.split(/,\s*/));
      }
    };
  }
}

module.exports = Helper;
