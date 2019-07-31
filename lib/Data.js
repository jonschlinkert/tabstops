'use strict';

const { get, set, hasOwn, del, isObject } = require('./utils');

const isPrimitive = value => {
  return typeof value !== 'function' && typeof value !== 'object';
};

class Data {
  constructor(values = {}) {
    this.cache = values;
  }

  get(...args) {
    let value = get(this.cache, ...args);
    if (value === null || value === undefined) {
      return;
    }

    if (isPrimitive(value)) {
      return String(value);
    }

    return value;
  }

  set(...args) {
    set(this.cache, ...args);
    return this;
  }

  has(...args) {
    return hasOwn(this.cache, ...args);
  }

  delete(...args) {
    del(this.cache, ...args);
    return this;
  }
}

module.exports = Data;
