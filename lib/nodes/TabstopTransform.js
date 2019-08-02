'use strict';

const Transform = require('./Transform');

class TabstopTransform extends Transform {
  constructor(node) {
    super(node);
    this.type = 'tabstop_transform';
    this.number = Number(this.match[2]);
  }

  compile(options = {}) {
    return () => {
      let saved = this.tabstops.get(this.number);
      let state = this.snapshot({ from: 'tabstop', value: this.transform(saved) });
      return this.format(state, options);
    };
  }
}

module.exports = TabstopTransform;
