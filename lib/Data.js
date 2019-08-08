'use strict';

const utils = require('./utils');

class Data {
  constructor(values = {}) {
    Reflect.defineProperty(this, 'cache', { value: values });
  }

  get(...args) {
    let value = utils.get(this.cache, ...args);
    if (value === null || value === void 0) {
      return;
    }

    if (utils.isPrimitive(value)) {
      return String(value);
    }

    return value;
  }

  set(...args) {
    utils.set(this.cache, ...args);
    return this;
  }

  has(...args) {
    return utils.hasOwn(this.cache, ...args);
  }

  delete(...args) {
    utils.del(this.cache, ...args);
    return this;
  }

  /**
   * Returns true if the given `value` is an instance of the Data class,
   * or is an object with get/set methods.
   * @param {Object} `value`
   * @return {Boolean}
   */

  static isData(value) {
    if (!utils.isObject(value)) {
      return false;
    }
    if (typeof value.get === 'function' && typeof value.set === 'function') {
      return true;
    }
    return false;
  }
}

module.exports = Data;
