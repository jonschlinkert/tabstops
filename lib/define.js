'use strict';

module.exports = (obj, key, value) => {
  Reflect.defineProperty(obj, key, { value, enumerable: false });
};
