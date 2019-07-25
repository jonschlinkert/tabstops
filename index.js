'use strict';

const Parser = require('./lib/Parser');

class Tabstops extends Parser {
  set(n, value) {
    this.tabstops.set(n, value);
    return this;
  }
  has(n) {
    return this.tabstops.has(n);
  }
  get(n) {
    return this.tabstops.get(n);
  }
  delete(n) {
    this.tabstops.delete(n);
    return this;
  }
}

module.exports = Tabstops;
