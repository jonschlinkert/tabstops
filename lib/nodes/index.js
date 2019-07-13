'use strict';

module.exports = {
  get Node() {
    return require('./Node');
  },
  get Placeholder() {
    return require('./Placeholder');
  },
  get Tabstop() {
    return require('./Tabstop');
  },
  get PlaceholderTransform() {
    return require('./PlaceholderTransform');
  },
  get VariableTransform() {
    return require('./VariableTransform');
  },
  get Variable() {
    return require('./Variable');
  }
};
