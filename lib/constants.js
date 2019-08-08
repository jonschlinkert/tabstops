'use strict';

const VARIABLE_REGEX_DOT = {
  VARIABLE_PLACEHOLDER_REGEX: /^(\${)([_a-zA-Z](?:\\\.|[_a-zA-Z0-9.])*(?<!\.)):/,
  VARIABLE_REGEX: /^(?:\$([_a-zA-Z](?:\\\.|[_a-zA-Z0-9.])*(?<!\.))|(\${)([_a-zA-Z](?:\\\.|[_a-zA-Z0-9.])*(?<!\.))})/,
  VARIABLE_TRANSFORM_REGEX: /^(\${)([_a-zA-Z](?:\\\.|[_a-zA-Z0-9.])*(?<!\.))\//
};

const VARIABLE_REGEX_NODOT = {
  VARIABLE_PLACEHOLDER_REGEX: /^(\${)([_a-zA-Z](?:\\\.|[_a-zA-Z0-9])*):/,
  VARIABLE_REGEX: /^(?:\$([_a-zA-Z](?:\\\.|[_a-zA-Z0-9])*)|(\${)([_a-zA-Z](?:\\\.|[_a-zA-Z0-9])*)})/,
  VARIABLE_TRANSFORM_REGEX: /^(\${)([_a-zA-Z](?:\\\.|[_a-zA-Z0-9])*)\//
};

module.exports = {
  WHITESPACE_TABLE: { '\n': '\\n', '\r': '\\r', '\t': '\\t', '\v': '\\v', '\f': '\\f' },

  BOM_REGEX: /^\ufeff/,
  ESCAPED_CHAR_REGEX: /^\\[^\\]/,
  OPEN_REGEX: /^\${((\\.|[^${}]+)(})?)/,
  SQUARE_BRACKETS_REGEX: /^\[(\\.|[^\]])+\]/,
  TEXT_REGEX: /^(\s+|[-_a-zA-Z0-9'";!@~`%^&*()+=?<>]+)/,
  HELPER_REGEX: /^([_a-zA-Z][_a-zA-Z0-9]*)\(([^)]+)\)/,

  CHOICES_OPEN_REGEX: /^(\$\{)([0-9]+|[_a-zA-Z][_a-zA-Z0-9]*)\|/,
  CHOICES_CLOSE_REGEX: /^\|\}/,

  // ${2|foo,bar|/(.*)/\${1:/upcase}/}
  CHOICES_TRANSFORM_REGEX: /^(\$\{)([0-9]+|[_a-zA-Z][_a-zA-Z0-9]*)\|([\s\S]+)\|\/([\s\S]+)\/\}/,

  TABSTOP_PLACEHOLDER_REGEX: /^(\${)([0-9]+):/,
  TABSTOP_REGEX: /^(?:\$([0-9]+)|(\${)([0-9]+)})/,
  TABSTOP_TRANSFORM_REGEX: /^(\${)([0-9]+)\//,
  TRANSFORM_FORMAT_REGEX: /^(?:\$([0-9]+)|(\${)([0-9]+|[_a-zA-Z][_a-zA-Z0-9]*)([-?+:/]+)?([\s\S]*?)(?<!(?<!\\)\\)})/,

  VARIABLE_REGEX_DOT,
  VARIABLE_REGEX_NODOT,

  /**
   * Extensions
   */

  CHECKBOX_REGEX: /^\${\[([-x ]?)\](?:[$#]([0-9]+|[_a-zA-Z][_a-zA-Z0-9]*))?:(\\[^\\]|[^}:]+?)(?::(\\[^\\]|[^}]+))?}/,
  FORMULA_REGEX: /^\${([_a-zA-Z][_a-zA-Z0-9]*)=([^}]+)}/,
  FORMAT_STRING_REGEX: /^(?:\$([0-9]+)|\${([0-9]+)(?:(:)?([-+?/]*)((?:\\[^\\]|.)+?)(?::((?:\\[^\\]|.)+?))?)?})(.*)$/,
  RADIO_REGEX: /^\${\(([-x ]?)\)(?:[$#]([0-9]+|[_a-zA-Z][_a-zA-Z0-9]*))?:(\\[^\\]|[^}:]+?)(?::(\\[^\\]|[^}]+))?}/,
  STATIC_FIELD_REGEX: /^#{([_a-zA-Z][_a-zA-Z0-9]*)(?::(\\[^\\]|[^\\}]+))?}/

};
