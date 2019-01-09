'use strict';

const content = require('./parse-content');
const snippet = require('./parse-snippet');

module.exports = (str, options) => {
  return str.trim().startsWith('<snippet>')
    ? snippet(str, options)
    : content(str, options);
};

module.exports.content = content;
module.exports.snippet = snippet;
