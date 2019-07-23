'use strict';

const { WHITESPACE_TABLE } = require('./constants');
exports.identity = value => value;

exports.format = str => str.replace(/[^\S ]/g, m => WHITESPACE_TABLE[m] || m);

exports.define = (node, key, value) => {
  Reflect.defineProperty(node, key, { writable: true, enumerable: false, value });
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
