'use strict';

const formatters = require('../formatters');
const Transform = require('./Transform');
const parse = require('../parse');

class PlaceholderTransform extends Transform {
  constructor(node = {}) {
    super('tabstop_transform', node);
  }

  initialState(locals = {}, options = {}) {
    return {
      resolved: 'tabstop',
      node: this,
      value: options.tabstops.get(this.tabstop),
      varname: this.tabstop
    };
  }

  compile(options) {
    return super.compile({ tabstops: new Map(), ...options });
    // let fns = this.precompile(options);

    // return (locals = {}) => {
    //   const state = this.initial(locals, { ...options, tabstops });

    //   if (!this.isValue(state.value)) {
    //     return formatters[this.type](state);
    //   }

    //   const parts = this.nodes.slice(1, -1).map(node => node.stringify());
    //   state.transform = parse.transform([state.varname, '/', ...parts], options);
    //   state.replacer = state.transform.replacer(state, options);
    //   state.resolved = 'inner';

    //   state.replace = value => {
    //     return `${value}`.replace(state.transform.regexp, state.replacer);
    //   };

    //   state.value = state.replace(state.value);
    //   // console.log(state);

    //   this.history.push({ ...state });
    //   return formatters[this.type](state);
    // };
  };
}

module.exports = PlaceholderTransform;
