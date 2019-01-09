'use strict';

const isObject = val => {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
};

exports.get = (obj = {}, prop = '', fallback) => {
  let value = obj[prop] == null
    ? prop.split('.').reduce((acc, k) => acc && acc[k], obj)
    : obj[prop];
  return (value == null || value === '') ? fallback : value;
};

exports.set = (obj = {}, prop = '', val) => {
  return prop.split('.').reduce((acc, k, i, arr) => {
    let value = arr.length - 1 > i ? (acc[k] || {}) : val;
    if (!isObject(value) && i < arr.length - 1) value = {};
    return (acc[k] = value);
  }, obj);
};
