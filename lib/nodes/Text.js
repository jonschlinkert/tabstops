'use strict';

const kType = Symbol('type');
const Placeholder = require('./Placeholder');
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
    if (this.type === 'text' && this.siblings.length === 3 && this.parent instanceof Placeholder) {
      this.type = 'placeholder';
    }

    return (data = {}) => {
      return this.format({ resolved: 'value', value: this.value }, options);
    };
  }
}

module.exports = Text;
