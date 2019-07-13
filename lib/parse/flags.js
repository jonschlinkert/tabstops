'use strict';

module.exports = params => {
  if (!params.placeholder) {
    let match = /^([gimsuy]+)(?::(.+))?$/.exec(params.flags);
    if (match) {
      params.placeholder = match[2] || '';
      params.flags = match[1];
    } else {
      params.placeholder = params.flags;
      params.flags = '';
    }
  }
};
