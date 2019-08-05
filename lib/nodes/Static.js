'use strict';

const Field = require('./Field');

class Static extends Field {
  constructor(node) {
    super(node);
    this.type = 'static';
    this.name = this.match[1];
    this.value = this.match[2];
  }
}

module.exports = Static;
