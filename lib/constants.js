'use strict';

module.exports = {
  WHITESPACE_TABLE: { '\n': '\\n', '\r': '\\r', '\t': '\\t', '\v': '\\v', '\f': '\\f' },
  CHOICES_REGEX: /^(?:\$\{([1-9]+)\|([\s\S]+?)(?<!(?<!\\)\\)\|\})/,
  ESCAPED_CHAR_REGEX: /^\\[^\\]/,
  FORMAT_STRING_REGEX: /^\$(?:([0-9]+)|{([0-9]+|[_a-zA-Z][_a-zA-Z0-9]*)([-?+:/]+)?(.*?)})/,
  INSERTION_REGEX: /\(\?([0-9]+):(?:((?:\\.|.)+?))(?::((?:\\[^\\]|.)+?))?(?<!(?<!\\)\\)\)/,
  NEWLINE_REGEX: /^(\r?\n|\r)/,
  OPEN_REGEX: /^\${/,
  SQUARE_BRACKETS_REGEX: /^\[(\\.|[^\]])+\]/,
  TABSTOP_PLACEHOLDER_REGEX: /^\${([0-9]+):/,
  TABSTOP_REGEX: /^\$(?:(?=([0-9]+))\1|{([0-9]+)})/,
  TABSTOP_TRANSFORM_REGEX: /^\${([0-9]+)\//,
  TEXT_REGEX: /^([^\S\n]+|[-_a-zA-Z0-9 ;!@~`#%^&*()+=?<>]+)/,
  VARIABLE_PLACEHOLDER_REGEX: /^\${([_a-zA-Z][_a-zA-Z0-9]*):/,
  VARIABLE_REGEX: /^\$(?:(?=([_a-zA-Z][_a-zA-Z0-9]*))\1|{([_a-zA-Z][_a-zA-Z0-9]*)})/,
  VARIABLE_TRANSFORM_REGEX: /^\${([_a-zA-Z][_a-zA-Z0-9]*)\//
};
