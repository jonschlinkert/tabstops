'use strict';

const Transform = require('./Transform');

class VariableTransform extends Transform {
  constructor(node) {
    super(node);
    this.type = 'variable_transform';
    this.name = this.match[2];
  }

  compile(options) {
    return (data = {}) => {
      let value = this.styles.unstyle(this.resolve(data, this.name));
      let state = this.snapshot({ from: 'variable', value: this.transform(value) });

      if (!this.isValue(state.value)) {
        state.from = 'name';
        state.value = this.name;
        this.snapshot(state);
      }

      return this.format(state, options, this.history);
    };
  }
}

module.exports = VariableTransform;
