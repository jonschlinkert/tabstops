'use strict';

const Transform = require('./Transform');

class PlaceholderTransform extends Transform {
  constructor(node) {
    super(node);
    this.type = 'placeholder_transform';
    this.tabstops = this.tabstops || new Map();
  }

  stringify() {
    if (this.nodes) {
      let inner = this.nodes.slice(1, -1).map(n => n.stringify()).join('');
      return `\${${this.tabstop}/${inner}}`;
    }
    return this.match[0];
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
