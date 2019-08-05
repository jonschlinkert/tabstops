'use strict';

const colors = require('ansi-colors').create();
const { bold, green, cyan, gray, dim, red, symbols } = colors;
const { bullet, cross, check, question, ellipsis } = symbols;

const statuses = {
  session: ['pending', 'submitted', 'cancelled'],
  static: ['hidden', 'muted', 'disabled', 'info', 'danger', 'warning', 'success']
};

exports.symbols = symbols;
exports.icons = {
  pending: check,
  disabled: '-',
  enabled: check,
  success: check,
  error: cross,
};

exports.styles = colors.theme({
  heading: colors.underline,
  pending: dim.gray,
  unchecked: dim.gray,
  disabled: gray,
  enabled: green,
  success: green,
  checked: green,
  muted: dim,
  cancelled: red,
  error: red
});

exports.prefix = {
  pending: cyan.bold(question),
  disabled: gray(question),
  enabled: green(check),
  success: green(check),
  error: red(cross)
};

exports.separator = {
  pending: dim(ellipsis),
  disabled: gray(bullet),
  enabled: dim(bullet),
  success: dim(bullet),
  error: red(bullet)
};

exports.message = {
  error: bold,
  pending: bold,
  enabled: bold,
  success: bold
};

exports.input = {
  error: bold,
  pending: bold,
  enabled: bold,
  success: bold
};

exports.hint = {
  pending: dim
};

exports.pointer = {
  enabled: cyan(symbols.pointer),
  pending: ' '
};

exports.elements = {
  prefix: exports.prefix,
  pointer: exports.pointer,
  message: exports.message,
  hint: exports.hint,
  separator: exports.separator,
  sep: exports.separator
};
