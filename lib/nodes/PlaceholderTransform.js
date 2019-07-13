'use strict';

const Transform = require('./Transform');

class PlaceholderTransform extends Transform {
  constructor(node) {
    super(node);
    this.type = 'tabstop_transform';
    this.tabstops = this.tabstops || new Map();
  }

  initialState() {
    return {
      resolved: 'tabstop',
      node: this,
      value: this.tabstops.get(this.tabstop),
      varname: this.tabstop
    };
  }
}

module.exports = PlaceholderTransform;
