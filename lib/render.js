'use strict';

const compile = require('./compile');
const parse = require('./parse');

module.exports = (str, locals, options) => {
  return compile(parse(str, { collate: true, ...options }))(locals);
};
