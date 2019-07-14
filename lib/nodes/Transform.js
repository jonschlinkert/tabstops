'use strict';

const formatters = require('../formatters');
const parse = require('../parse');
const Node = require('./Node');

class Transform extends Node {
  constructor(node = {}) {
    super(node);
    this.nodes = node.nodes || [];
  }

  inner(join = true) {
    let node = this.clone();

    let keys = ['open_brace', 'close_brace'];
    node.visit(node => {
      if (keys.includes(node.type)) {
        node.value = '';
      }
    });

    let value = this.match[2] || this.match[3];
    let sep = this.match[4];

    node.nodes[0].value = `${value}${sep}`;
    let inner = node.nodes.map(n => n.inner());
    if (join !== false) {
      return inner.join('');
    }
    return inner;

    // let value = this.match[2] || this.match[3];
    // let sep = this.match[4];
    // let parts = this.nodes.slice(1, -1).map(node => node.stringify());
    // return [value, sep, ...parts].join('');
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

  transform(options) {
    // const parts = this.nodes.slice(1, -1).map(node => node.stringify());
    return parse.transform(this.inner(false), options);
  }

  compile(options) {
    return (locals = {}) => {
      const state = this.initialState(locals, options);

      if (!this.isValue(state.value)) {
        return formatters[this.type](state);
      }

      state.transform = this.transform(options);
      state.replacer = state.transform.replacer(state, options);
      state.resolved = 'inner';

      state.replace = value => {
        return `${value}`.replace(state.transform.regexp, state.replacer);
      };

      state.value = state.replace(state.value);
      return formatters[this.type](state);
    };
  }
}

module.exports = Transform;
