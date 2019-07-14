'use strict';

const { replacer } = require('./');

module.exports = (parts, options) => {
  const keys = ['varname', 'source', 'format', 'flags'];

  let segments = parts.slice();
  let type = keys.shift();
  let params = {};

  while (segments.length) {
    let segment = segments.shift();

    if (segment === '/') {
      params[(type = keys.shift())] = segments.shift();
      continue;
    }

    if (params[type]) {
      params[type] = [].concat(params[type]).concat(segment);
    } else {
      params[type] = segment;
    }
  }

  while (keys.length) params[keys.shift()] = '';
  params.regexp = new RegExp(params.source, params.flags);
  params.replacer = replacer(params.format);
  return params;
};
