'use strict';

module.exports = {
  uppercase(value) {
    return value ? value.toLocaleUpperCase() : '';
  },
  upcase(value) {
    return value ? value.toLocaleUpperCase() : '';
  },
  lowercase(value) {
    return value ? value.toLocaleLowerCase() : '';
  },
  downcase(value) {
    return value ? value.toLocaleLowerCase() : '';
  },
  capitalize(value) {
    return value ? value[0].toLocaleUpperCase() + value.slice(1) : '';
  }
};
