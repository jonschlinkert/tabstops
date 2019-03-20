'use strict';

const compile = require('./compile');
const parse = require('./parse');

module.exports = async(str, locals, options) => {
  return (await compile(await parse(str, options), options))(locals);
};
