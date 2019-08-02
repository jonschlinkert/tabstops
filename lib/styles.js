'use strict';

const colors = require('ansi-colors').create();
const { bold, green, cyan, dim, red, symbols } = colors;
const { cross, check, question } = symbols;

exports.symbols = symbols;
exports.icons = {
  error: cross,
  pending: check,
  enabled: check,
  disabled: '-'
};

exports.styles = colors.theme({
  error: red,
  pending: dim.gray,
  enabled: green,
  disabled: dim,
  heading: colors.underline,
});

exports.prefix = {
  error: red(cross),
  pending: cyan.bold(question),
  enabled: green(check)
};

exports.message = {
  error: bold,
  pending: bold,
  enabled: bold
};

exports.elements = {
  prefix: exports.prefix,
  message: exports.message
};
