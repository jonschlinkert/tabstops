'use strict';

const Node = require('./Node');

class Close extends Node {
  constructor(node) {
    super(node);
    this.type = 'close';
  }

  inner() {
    return '';
  }
}

module.exports = Close;
