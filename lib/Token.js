'use strict';

const utils = require('./utils');

class Token {
  constructor(type, value, match) {
    this.type = '';
    this.value = '';
    this.match = [];

    if (Array.isArray(value)) {
      match = value;
      value = match[1] || match[0];
    }

    if (utils.isObject(type)) {
      Object.assign(this, type);
    } else {
      this.type = type;
      this.value = value;
    }

    // Reflect.defineProperty(this, 'match', {
    //   enumerable: false,
    //   writable: true,
    //   value: this.match
    // });
  }

  static isToken(value) {
    return value instanceof this;
  }
}

module.exports = Token;
