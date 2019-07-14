'use strict';

const REPLACER_REGEX = /^\${?([0-9]+)(?::([-+?])\/([_a-zA-Z][_a-zA-Z0-9]*))?}?/;
const builtins = require('../helpers');
const identity = value => value;

module.exports = format => {
  return (state = {}, options = {}) => {
    const helpers = { ...builtins, ...options.helpers };
    const replacers = [].concat(format).map(str => {
      let [match, tabstop, operator, helper ] = (REPLACER_REGEX.exec(str) || []);
      if (!match) return null;

      return {
        index: Number(tabstop),
        helper: helpers[helper] || identity,
        operator
      };
    });

    return (...args) => {
      let output = '';

      for (const replacer of replacers) {
        if (replacer) {
          output += replacer.helper(args[replacer.index], state);
        }
      }

      return output;
    };
  };
};
