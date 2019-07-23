'use strict';

class TabState {
  constructor(state = {}) {
    this.tabstop = state.tabstop || 1;
    this.cursor = state.cursor || 0;
    this.index = state.index || 0;
    this.limit = state.limit || 0;
  }
}

module.exports = TabState;
