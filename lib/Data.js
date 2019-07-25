'use strict';

const { get, set, hasOwn, del } = require('./utils');

class Data {
  constructor(values = {}) {
    this.values = values;
  }

  get(...args) {
    return get(this.values, ...args);
  }

  set(...args) {
    set(this.values, ...args);
    return this;
  }

  has(...args) {
    return hasOwn(this.values, ...args);
  }

  delete(...args) {
    del(this.values, ...args);
    return this;
  }
}

module.exports = Data;
