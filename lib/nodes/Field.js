'use strict';

const { icons, elements, styles, symbols } = require('../styles');
const { define } = require('../utils');
const Node = require('./Node');

class Field extends Node {
  constructor(node) {
    super(node);
    define(this, 'styles', styles);
    define(this, 'elements', elements);
    define(this, 'symbols', symbols);
    define(this, 'icons', icons);
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
  static get Field() {
    return Field;
  }
  static get Node() {
    return Node;
  }
}

module.exports = Field;
