'use strict';

const VARIABLE_REGEX_DOT = {
  VARIABLE_PLACEHOLDER_REGEX: /^(\${)([_a-zA-Z][_a-zA-Z0-9.]*(?<!\.)):/,
  VARIABLE_REGEX: /^(?:\$([_a-zA-Z][_a-zA-Z0-9.]*(?<!\.))|(\${)([_a-zA-Z][_a-zA-Z0-9.]*(?<!\.))})/,
  VARIABLE_TRANSFORM_REGEX: /^(\${)([_a-zA-Z][_a-zA-Z0-9.]*(?<!\.))\//
};

const VARIABLE_REGEX_NODOT = {
  VARIABLE_PLACEHOLDER_REGEX: /^(\${)([_a-zA-Z][_a-zA-Z0-9]*):/,
  VARIABLE_REGEX: /^(?:\$([_a-zA-Z][_a-zA-Z0-9]*)|(\${)([_a-zA-Z][_a-zA-Z0-9]*)})/,
  VARIABLE_TRANSFORM_REGEX: /^(\${)([_a-zA-Z][_a-zA-Z0-9]*)\//
};

module.exports = {
  WHITESPACE_TABLE: { '\n': '\\n', '\r': '\\r', '\t': '\\t', '\v': '\\v', '\f': '\\f' },

  ESCAPED_CHAR_REGEX: /^\\[^\\]/,
  NEWLINE_REGEX: /^(\r?\n|\r)/,
  OPEN_REGEX: /^\${((?:\\.|[^${}])+(}))?/,
  SQUARE_BRACKETS_REGEX: /^\[(\\.|[^\]])+\]/,
  TEXT_REGEX: /^([^\S\n]+|[-_a-zA-Z0-9 ;!@~`#%^&*()+=?<>]+)/,

  INSERTION_REGEX: /\(\?([0-9]+):(?:((?:\\.|.)+?))(?::((?:\\[^\\]|.)+?))?(?<!(?<!\\)\\)\)/,
  CHOICES_REGEX: /^(?:(\$\{)([1-9]+)\|([\s\S]+?)(?<!(?<!\\)\\)\|\})/,
  TABSTOP_PLACEHOLDER_REGEX: /^(\${)([0-9]+):/,
  TABSTOP_REGEX: /^(?:\$([0-9]+)|(\${)([0-9]+)})/,
  TABSTOP_TRANSFORM_REGEX: /^(\${)([0-9]+)\//,
  TRANSFORM_FORMAT_REGEX: /^(?:\$([0-9]+)|(\${)([0-9]+|[_a-zA-Z][_a-zA-Z0-9]*)([-?+:/]+)?([\s\S]*?)(?<!(?<!\\)\\)})/,
  FORMAT_STRING_REGEX: /^(?:\$([0-9]+)|\${([0-9]+)(?:(:)?([-+?/])?((?:\\[^\\]|.)+?)(?::((?:\\[^\\]|.)+?))?)?})(.*)$/,

  VARIABLE_REGEX_DOT,
  VARIABLE_REGEX_NODOT
};
