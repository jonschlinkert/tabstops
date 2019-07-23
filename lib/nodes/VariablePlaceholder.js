'use strict';

const Block = require('./Block');

class VariablePlaceholder extends Block {
  constructor(node) {
    super(node);
    this.type = 'variable_placeholder';
  }

  placeholder(options) {
    let fns = this.innerNodes.map(node => node.compile(options));
    return (data, tabstops) => {
      return fns.map(fn => fn(data, tabstops)).join('');
    };
  }

  compile(options) {
    let placeholder = this.placeholder(options);
    return (data = {}, tabstops) => {
      return data[this.name] || placeholder(data, tabstops);
    };
  }

  get name() {
    return this.nodes[0].match[1];
  }
}

module.exports = VariablePlaceholder;
