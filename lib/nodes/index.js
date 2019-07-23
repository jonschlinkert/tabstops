'use strict';

module.exports = {
  get Block() {
    return require('./Block');
  },
  get Choices() {
    return require('./Choices');
  },
  get Format() {
    return require('./Format');
  },
  get Node() {
    return require('./Node');
  },
  get Tabstop() {
    return require('./Tabstop');
  },
  get TabstopPlaceholder() {
    return require('./TabstopPlaceholder');
  },
  get TabstopTransform() {
    return require('./TabstopTransform');
  },
  get Transform() {
    return require('./Transform');
  },
  get Variable() {
    return require('./Variable');
  },
  get VariablePlaceholder() {
    return require('./VariablePlaceholder');
  },
  get VariableTransform() {
    return require('./VariableTransform');
  }
};
