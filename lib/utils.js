'use strict';

exports.identity = value => value;

exports.define = (node, key, value) => {
  Reflect.defineProperty(node, key, { configurable: true, enumerable: false, value });
};

exports.isObject = value => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

exports.assertNumber = (value, message) => {
  if (!Number.isInteger(value)) {
    throw new SyntaxError(`Expected tabstop: "${value}" to be a number.`);
  }
  return true;
};

