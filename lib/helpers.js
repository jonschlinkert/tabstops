'use strict';

exports.capitalize = str => {
  return str ? (str[0].toLocaleUpperCase() + str.slice(1)) : '';
};

exports.upcase = str => {
  return str ? str.toLocaleUpperCase() : '';
};

exports.downcase = str => {
  return str ? str.toLocaleLowerCase() : '';
};

exports.lowercase = str => {
  return str ? str.toLocaleLowerCase() : '';
};

exports.uppercase = str => {
  return str ? str.toLocaleUpperCase() : '';
};

exports.pascalcase = (str = '') => {
  let match = str.match(/[a-z]+/gi);
  if (match) {
    return match.map(m => m[0].toUpperCase() + m.slice(1).toLowerCase()).join('');
  }
  return str;
};

