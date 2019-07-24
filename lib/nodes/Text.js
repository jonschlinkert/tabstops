'use strict';

const Node = require('./Node');

class Text extends Node {
  constructor(node) {
    super(node);
    this.type = 'text';
    this.value = this.value || this.match[0] || '';
  }

  stringify() {
    return this.value;
  }

  inner() {
    return this.value;
  }

  compile(options) {
    return (data = {}) => {
      return this.format({ node: this, resolved: 'value', value: this.value }, options);
    }
  }
}

module.exports = Text;
