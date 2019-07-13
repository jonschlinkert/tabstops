'use strict';

const Transform = require('./Transform');

class VariableTransform extends Transform {
  constructor(node) {
    super(node);
    this.type = 'variable_transform';
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
