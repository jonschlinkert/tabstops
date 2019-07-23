'use strict';

const Transform = require('./Transform');

class VariableTransform extends Transform {
  constructor(node) {
    super(node);
    this.type = 'variable_transform';
  }

  initialState(context = {}) {
    return {
      resolved: 'value',
      node: this,
      value: context[this.variable] || '',
      varname: this.variable
    };
  }
}

module.exports = VariableTransform;
