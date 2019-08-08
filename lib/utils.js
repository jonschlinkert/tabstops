'use strict';

const { WHITESPACE_TABLE } = require('./constants');

exports.isPrimitive = value => {
  return typeof value !== 'function' && typeof value !== 'object';
};

exports.trailingIndent = (value = '') => {
  if (!value.includes('\n')) {
    return value.trim() === '' ? value : '';
  }

  let match = /\n( +)$/.exec(value);
  if (match) {
    return match[1];
  }

  return '';
};

exports.bind = (target, provider = {}) => {
  for (let key of Object.keys(provider)) {
    target[key] = provider[key].bind(target);
  }
};

exports.field = (key, options = {}) => {
  let identity = state => state.value;
  let value = options[key];
  let defaults = { format: identity, results: identity, validate: () => true };
  if (typeof value === 'function') {
    value = { format: value };
  }
  return { ...defaults, ...value };
};

exports.normalize = str => str.replace(/[^\S ]/g, m => WHITESPACE_TABLE[m] || m);

/**
 * Union items to an array on the property of a Map.
 */

exports.union = (map, key, node) => {
  if (!map.has(key)) {
    map.set(key, [node]);
  } else {
    map.set(key, map.get(key).concat(node));
  }
};

exports.define = (node, key, value) => {
  Reflect.defineProperty(node, key, {
    writable: true,
    configurable: true,
    enumerable: false,
    value
  });
};

exports.sortMap = map => {
  const newMap = new Map();
  const keys = [...map.keys()];
  keys.sort((a, b) => (String(a).localeCompare(String(b))));
  for (let key of keys) {
    newMap.set(key, map.get(key));
  }
  return newMap;
};

exports.wrap = (arr, n = 0) => {
  if (n === 0) return arr;
  if (n < 0) {
    n = -Math.min(arr.length, Math.abs(n));
    return [...arr.slice(n), ...arr.slice(0, arr.length + n)];
  }
  n = Math.min(arr.length, n);
  return [...arr.slice(n), ...arr.slice(0, n)];
};

exports.slice = (lines, start = 0, end = lines.length) => {
  if (start < 0) {
    return [...lines.slice(start), ...lines.slice(0, end)];
  }
  return start === end ? [lines[start]] : lines.slice(start, end);
};

exports.isObject = value => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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

exports.set = (obj, prop, val) => {
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

exports.get = (obj, prop, fallback) => {
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

exports.del = (obj, prop) => {
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

exports.hasOwn = (obj, prop) => {
  if (!prop) return false;
  if (obj.hasOwnProperty(prop)) return true;
  let segs = split(prop);
  let last = segs.pop();
  if (!segs.length) return false;
  let val = exports.get(obj, segs.join('.'));
  return exports.isObject(val) && val.hasOwnProperty(last);
};
