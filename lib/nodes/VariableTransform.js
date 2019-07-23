'use strict';

const Transform = require('./Transform');

class VariableTransform extends Transform {
  constructor(node) {
    super(node);
    this.type = 'variable_transform';
  }

  compile(options) {
    return (data = {}, tabstops) => {
      let value = data[this.name] || this.name;
      let transform = this.transform(options, value);
      return transform;
    };
  }

  get name() {
    return this.nodes[0].match[1];
  }
}

module.exports = VariableTransform;
