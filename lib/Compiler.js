'use strict';

class Compiler {
  constructor(ast, options) {
    this.options = { ...options };
    this.ast = ast;
  }
}

module.exports = Compiler;
