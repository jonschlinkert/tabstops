'use strict';

const VARIABLE_REGEX = /([_a-zA-Z][_0-9a-zA-Z]*)/g;
const Node = require('./Node');

class Formula extends Node {
  constructor(node) {
    super(node);
    this.type = 'formula';
    this.name = this.match[1];
    this.args = this.match[2];
    this.params = [];
  }

  compile(options) {
    let str = this.args.replace(VARIABLE_REGEX, (m, $1, $2, $3) => {
      this.params.push($2);
      return `ctx.${$1}`;
    });

    let fn = new Function('ctx', `return ${str}`);

    return (data = {}) => {
      let value = fn({ ...this.values.variable.cache, ...data });
      let state = { resolved: 'eval', value };

      if (this.isValue(state.value)) {
        this.variables.set(this.name, state.value);
      }

      return this.format(state, options);
    };
  }
}

module.exports = Formula;
