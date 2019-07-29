'use strict';

const colors = require('ansi-colors');
const Transform = require('./Transform');

class VariableTransform extends Transform {
  constructor(node) {
    super(node);
    this.type = 'variable_transform';
    this.name = this.match[2];
  }

  compile(options) {
    return (data = {}) => {
      let value = colors.unstyle(this.resolve(data, this.name));
      let state = { resolved: 'variable', value: this.transform(value) };

      if (!this.isValue(state.value)) {
        state.resolved = 'name';
        state.value = this.name;
      }

      return this.format(state, options);
    };
  }
}

module.exports = VariableTransform;
