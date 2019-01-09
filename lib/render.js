'use strict';

const compile = require('./compile');

module.exports = (ast, locals, options) => compile(ast, options)(locals);
