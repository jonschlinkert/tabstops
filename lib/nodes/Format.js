'use strict';

const Node = require('./Node');

class Format extends Node {
  constructor(node) {
    super(node);
    this.type = 'format';
  }

  inner() {
    return this.match[0];
  }
}

module.exports = Format;
