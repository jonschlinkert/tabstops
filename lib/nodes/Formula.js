'use strict';

const VARIABLE_REGEX = /(?<![\\'"\w])([_a-zA-Z][_0-9a-zA-Z.]*)(?<!\.)(?![\w'"])/g;
const Node = require('./Node');

const interpolate = (input, data) =>  {
  return (locals, node) => {
    const ctx = { ...data, ...locals, node };
    const keys = Object.keys(ctx);
    const vals = Object.values(ctx);
    return Function(keys, `return ${input}`).apply(ctx, vals);
  };
};

class Formula extends Node {
  constructor(node) {
    super(node);
    this.type = 'formula';
    this.name = this.match[1];
    this.args = this.match[2];
    this.params = [];
  }

  compile(options = {}) {
    let input = this.args.replace(VARIABLE_REGEX, (m, $1, $2, $3) => {
      this.params.push($2);
      return $1;
      // return `ctx.${$1}`;
    });

    let fn = interpolate(input, options.data);

    return (data = {}) => {
      let locals = { ...this.variables.cache, ...data };
      let value = fn(locals, this);
      let state = { from: 'eval', params: this.params, value };
      this.snapshot(state);

      if (this.isValue(state.value)) {
        this.variables.set(this.name, state.value);
      }

      return this.format(state, options, this.history);
    };
  }
}

module.exports = Formula;
