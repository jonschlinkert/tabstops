'use strict';

const { define } = require('./utils');

class Scope {
  constructor(scope = {}) {
    this.type = scope.type;
    this.context = scope.context || {};
    this.blocks = scope.blocks || [];
  }

  push(block) {
    define(block, 'scope', this);
    this.blocks.push(block);
    return block;
  }

  isInside(type) {
    return this.parent && (this.parent.type === type || this.parent.isInside(type));
  }
}

module.exports = Scope;
