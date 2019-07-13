'use strict';

module.exports = {
  get flags() {
    return require('./flags');
  },
  get replacer() {
    return require('./replacer');
  },
  get transform() {
    return require('./transform');
  }
};
