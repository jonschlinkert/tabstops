'use strict';

const colors = require('ansi-colors');
const noop = str => str;

module.exports = (options = {}) => ({
  info: options.debug ? (options.info || colors.cyan) : noop,
  primary: options.debug ? (options.primary || colors.cyan) : noop,
  danger: options.debug ? (options.danger || colors.red) : noop,
  success: options.debug ? (options.success || colors.green) : noop,
  warning: options.debug ? (options.warning || colors.yellow) : noop,
  muted: options.debug ? (options.muted || colors.dim) : noop
});
