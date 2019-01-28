'use strict';

const util = require('util');

module.exports = value => {
  const pretty = require('prettier');
  let opts = { parser: 'babylon', semi: false, singleQuote: true };
  let prefix = 'const temp =';
  let str = prefix + util.inspect(value, { depth: Infinity });
  return pretty.format(str, opts).trim().slice(prefix.length).trim() + '\n';
};
