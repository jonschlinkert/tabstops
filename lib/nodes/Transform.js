'use strict';

const formatters = require('../formatters');
const parse = require('../parse');
const Node = require('./Node');

class Transform extends Node {
  constructor(type = 'transform', node = {}) {
    super(node);
    this.type = type;
    this.nodes = node.nodes || [];
  }

  /**
   * The initial state object to be used by the compile method
   * when resolving values.
   * @param {Object} `locals``
   * @param {Object} `options`
   * @return {Object}
   */

  initialState(locals = {}, options = {}) {
    return { node: this, resolved: 'value', value: this.value, varname: this.value };
  }

  compile(options) {
    let fns = this.precompile(options);

    return (locals = {}) => {
      const state = this.initialState(locals, options);

      if (!this.isValue(state.value)) {
        return formatters[this.type](state);
      }

      const parts = this.nodes.slice(1, -1).map(node => node.stringify());
      state.transform = parse.transform([state.varname, '/', ...parts], options);
      state.replacer = state.transform.replacer(state, options);
      state.resolved = 'inner';

      state.replace = value => {
        return `${value}`.replace(state.transform.regexp, state.replacer);
      };

      state.value = state.replace(state.value);
      // console.log(state);

      this.history.push({ ...state });
      return formatters[this.type](state);
    };
  }
}

module.exports = Transform;
