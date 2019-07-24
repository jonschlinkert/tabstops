'use strict';

const Node = require('./Node');

class Open extends Node {
  constructor(node) {
    super(node);
    this.type = 'open';
  }

  inner() {
    let value = this.value || this.match[0];
    if (value) {
      return value.replace(/^\${/, '');
    }
    return '';
  }
}

module.exports = Open;
