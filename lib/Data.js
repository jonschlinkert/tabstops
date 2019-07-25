'use strict';

const { get, set, hasOwn, del } = require('./utils');

const isPrimitive = value => {
  return typeof value !== 'function' && typeof value !== 'object';
};

class Data {
  constructor(values = {}) {
    this.values = values;
  }

  get(...args) {
    let value = get(this.values, ...args);
    if (value === null || value === undefined) {
      return;
    }
    if (isPrimitive(value)) {
      return String(value);
    }
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
