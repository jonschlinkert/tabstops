'use strict';

const Node = require('./Node');

class Variable extends Node {
  constructor(node) {
    super(node);
    this.type = 'variable';
    this.name = this.match[1];
  }

  compile() {
    return (data = {}) => data[this.name] || '';
  }
}

module.exports = Variable;
