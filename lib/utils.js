'use strict';

const { WHITESPACE_TABLE } = require('./constants');
exports.identity = value => value;

exports.normalize = str => str.replace(/[^\S ]/g, m => WHITESPACE_TABLE[m] || m);

exports.define = (node, key, value) => {
  Reflect.defineProperty(node, key, {
    writable: true,
    configurable: true,
    enumerable: false,
    value
  });
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

/**
 * Splits a string with the given separator, unless the separator
 * is escaped with `\\`. Used by the get, set, has, and hasOwn utils.
 * @param {String} str The string to split.
 * @param {String} sep Separator, `.` by default.
 * @return {Array}
 */

const split = exports.split = (str, sep = '.') => {
  let segs = str.split(sep);
  for (let i = 0; i < segs.length; i++) {
    while (segs[i] && segs[i].slice(-1) === '\\') {
      segs[i] = segs[i].slice(0, -1) + sep + segs.splice(i + 1, 1);
    }
  }
  return segs;
};

/**
 * Set a value on the given object.
 * @param {Object} obj
 * @param {String} prop
 * @param {any} value
 */

exports.set = (obj = {}, prop = '', val) => {
  if (/[/:]/.test(prop)) {
    obj[prop] = val;
    return obj;
  }

  return split(prop).reduce((acc, k, i, arr) => {
    let value = arr.length - 1 > i ? (acc[k] || {}) : val;
    if (!exports.isObject(value) && i < arr.length - 1) value = {};
    return (acc[k] = value);
  }, obj);
};

/**
 * Get a value from the given object.
 * @param {Object} obj
 * @param {String} prop
 */

exports.get = (obj = {}, prop = '', fallback) => {
  if (Array.isArray(prop)) {
    return exports.getFirst(obj, prop, fallback);
  }

  let value = obj[prop] === void 0
    ? split(prop).reduce((acc, k) => acc && acc[k], obj)
    : obj[prop];
  return value === void 0 ? fallback : value;
};

/**
 * Delete a value from the given object.
 * @param {Object} obj
 * @param {String} prop
 */

exports.del = (obj = {}, prop = '') => {
  if (!prop) return false;
  if (obj.hasOwnProperty(prop)) {
    delete obj[prop];
    return true;
  }
  let segs = split(prop);
  let last = segs.pop();
  let val = segs.length ? exports.get(obj, segs.join('.')) : obj;
  if (exports.isObject(val) && val.hasOwnProperty(last)) {
    delete val[last];
    return true;
  }
};

/**
 * Returns true if the given object has the specified property.
 * @param {Object} obj
 * @param {String} prop Dot-notation may be used.
 */

exports.hasOwn = (obj = {}, prop = '') => {
  if (!prop) return false;
  if (obj.hasOwnProperty(prop)) return true;
  let segs = split(prop);
  let last = segs.pop();
  if (!segs.length) return false;
  let val = exports.get(obj, segs.join('.'));
  return exports.isObject(val) && val.hasOwnProperty(last);
};

/**
 * Get the first value from an array of properties.
 * @param {Object} obj
 * @param {Array} props
 */

exports.getFirst = (obj = {}, props = [], fallback) => {
  for (let key of [].concat(props || [])) {
    let value = exports.get(obj, key);
    if (value != null) {
      return value;
    }
  }
  return fallback;
};
