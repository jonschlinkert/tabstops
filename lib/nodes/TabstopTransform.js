'use strict';

const Transform = require('./Transform');

class TabstopTransform extends Transform {
  constructor(node) {
    super(node);
    this.type = 'tabstop_transform';
  }

  compile(options) {
    return (data = {}, tabstops) => {
      let value = tabstops.get(this.tabstop) || '';
      let transformed = this.transform(options, value);
      tabstops.set(this.tabstop, transformed);
      return transformed;
    };
  }

  get tabstop() {
    return Number(this.nodes[0].match[1]);
  }
}

module.exports = TabstopTransform;
