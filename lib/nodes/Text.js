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
    return () => {
      let state = this.snapshot({ from: 'value', value: this.value });
      return this.format(state, options);
    };
  }
}

module.exports = Text;
