'use strict';

const Transform = require('./Transform');

class VariableTransform extends Transform {
  constructor(node) {
    super(node);
    this.type = 'variable_transform';
  }

  stringify() {
    let inner = this.nodes.slice(1, -1).map(n => n.stringify()).join('');
    return `${this.match[0]}${inner}}`;
  }

  initialState(locals = {}) {
    return {
      resolved: 'value',
      node: this,
      value: locals[this.variable] || '',
      varname: this.variable
    };
  }
}

module.exports = VariableTransform;
