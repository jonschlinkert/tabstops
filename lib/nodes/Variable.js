'use strict';

const Input = require('./Input');

class Variable extends Input {
  constructor(node) {
    super(node);
    this.type = 'variable';
  }
}

module.exports = Variable;
