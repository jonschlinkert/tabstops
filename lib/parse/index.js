'use strict';

module.exports = {
  get choices() {
    return require('./choices');
  },
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
