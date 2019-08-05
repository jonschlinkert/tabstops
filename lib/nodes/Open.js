'use strict';

const Text = require('./Text');

class Open extends Text {
  constructor(node) {
    super(node);
    this.type = 'open';
  }

  inner() {
    return this.value.replace(/^\${/, '');
  }
}

module.exports = Open;
