'use strict';

const content = require('./parse-content');
const snippet = require('./parse-snippet');

const parse = (str, options) => {
  return str.trim().startsWith('<snippet>') ? snippet(str, options) : content(str, options);
};

parse.content = content;
parse.snippet = snippet;
module.exports = parse;
