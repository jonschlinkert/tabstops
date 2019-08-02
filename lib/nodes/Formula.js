'use strict';

const VARIABLE_REGEX = /([_a-zA-Z][_0-9a-zA-Z.]*)(?<!\.)/g;
const Node = require('./Node');

const interpolate = (input, data) =>  {
  return locals => {
    const ctx = { ctx: { ...data, ...locals } };
    const keys = Object.keys(ctx);
    const vals = Object.values(ctx);
    return Function('ctx', `return ${input}`).apply(ctx, vals);
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
      return `ctx.${$1}`;
    });

    let fn = interpolate(input, options.data);

    return (data = {}) => {
      let value = fn({ ...this.values.variable.cache, ...data });
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
