'use strict';

const Transform = require('./Transform');

class VariableTransform extends Transform {
  constructor(node) {
    super(node);
    this.type = 'variable_transform';
  }

  compile(options) {
    return (data = {}) => {
      let state = { node: this, resolved: 'variable', value: data[this.name] };

      if (!this.isValue(state.value)) {
        state.resolved = 'name';
        state.value = this.name;
      }

      state.value = this.transform(state.value);
      return this.format(state, options);
    };
  }

  get name() {
    return this.nodes[0].match[1];
  }
}

module.exports = VariableTransform;
