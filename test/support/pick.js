'use strict';

module.exports = (obj, keys = []) => {
  let result = {};
  for (let key of keys) {
    if (obj[key] !== void 0) {
      result[key] = obj[key];
    }
  }
  return result;
};
