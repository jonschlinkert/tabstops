'use strict';

const Text = require('./Text');

class Close extends Text {
  constructor(node) {
    super(node);
    this.type = 'close';
  }

  inner() {
    return '';
  }
}

module.exports = Close;
