'use strict';

class TabState {
  constructor(options = {}) {
    this.tabstop = options.tabstop || 1;
    this.cursor = options.cursor || 0;
    this.index = options.index || 0;
    this.limit = options.limit || 0;
  }
}

module.exports = TabState;
