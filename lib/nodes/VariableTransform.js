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

      // if (this.isValue(value) && !this.isValue(this.raw)) {
      //   this.raw = colors.unstyle(value);
      // }

      let state = { resolved: 'variable', value };

      // if (!this.isValue(state.value) && this.isValue(this.initial)) {
      //   state.resolved = 'initial';
      //   state.value = this.initial;
      // }

      // if (!this.isValue(state.value)) {
      //   state.resolved = 'input';
      //   state.value = this.input;
      // }

      // if (!this.isValue(state.value)) {
      //   state.resolved = 'raw';
      //   state.value = this.raw;
      // }

      // if (!this.isValue(state.value)) {
      //   state.resolved = 'name';
      //   state.value = this.name;
      // }

      if (this.isValue(state.value)) {
        state.value = this.transform(colors.unstyle(state.value));
      }

      return this.format(state, options);
    };
  }
}

module.exports = VariableTransform;
