'use strict';

const Text = require('./Text');

class Open extends Text {
  constructor(node) {
    super(node);
    this.type = 'open';
  }

  inner() {
    let value = this.value || this.match[0];

    if (this.isValue(value)) {
      return value.replace(/^\${/, '');
    }

    return '';
  }
}

module.exports = Open;
