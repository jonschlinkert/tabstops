'use strict';

const REPLACER_REGEX = /^(\$[0-9]+)(?::([-+?])\/([_a-zA-Z][_a-zA-Z0-9]*))?/;
const identity = value => value;

module.exports = format => {
  return (state = {}, options = {}) => {
    const helpers = options.helpers || {};
    const replacers = [].concat(format).map(str => {
      const [, tabstop, operator, helper ] = REPLACER_REGEX.exec(str);

      return {
        index: Number(tabstop.slice(1)),
        helper: helpers[helper] || identity,
        operator
      };
    });

    return (...args) => {
      let output = '';

      for (const replacer of replacers) {
        output += replacer.helper(args[replacer.index], state);
      }

      return output;
    };
  };
};
