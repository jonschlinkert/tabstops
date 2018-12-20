'use strict';

const define = require('./lib/define');
const parse = require('./lib/parse');

module.exports = (str, options) => {
  if (str.startsWith('<snippet>')) {
    return parse.snippet(str, options);
  }
  return parse.content(str, options);
};
