'use strict';

const Node = require('./Node');

class Field extends Node {
  constructor(field) {
    super(field);
  }
  format(state) {
    return state.value;
  }
  result(state) {
    return state.value;
  }
  validate(state) {
    return true;
  }
}

module.exports = Field;
