'use strict';

const Node = require('./Node');

class Format extends Node {
  constructor(node) {
    super(node);
    this.type = 'format';
  }
}

module.exports = Format;
