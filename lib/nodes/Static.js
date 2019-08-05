'use strict';

const Node = require('./Node');

class Static extends Node {
  constructor(node) {
    super(node);
    this.type = 'static';
    this.status = 'pending';
    this.name = this.match[1];
    this.value = this.match[2];
  }
  print(data, options = {}) {
    let value = this.resolve([options.data, data], this.name);
    let output = [value, this.value, this.name].find(v => this.isValue(v));
    if (typeof this.element === 'function') {
      return this.element(output);
    }
    return this.element || output;
  }
  get element() {
    let element = this.elements[this.name];
    if (element) {
      return element[this.status || 'pending'];
    }
  }
  compile(options) {
    return data => {
      let value = this.print(data, options);
      let state = this.snapshot({ from: 'value', value });
      return this.format(state, options);
    }
  }
}

module.exports = Static;
