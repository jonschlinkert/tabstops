'use strict';

const Node = require('./Node');

class Static extends Node {
  constructor(node) {
    super(node);
    this.type = 'static';
    this.status = 'pending';
    this.name = this.match[1];
    this.value = this.match[2];
    this.element = this.elements[this.name];
  }

  print() {
    let value = this.element[this.status];
    if (typeof value === 'function') {
      return value(this.value);
    }
    return value;
  }
}

module.exports = Static;
