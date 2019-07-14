'use strict';

module.exports = {
  WHITESPACE_TABLE: { '\n': '\\n', '\r': '\\r', '\t': '\\t', '\v': '\\v', '\f': '\\f' },
  rules: {
    bom: /^\ufeff/,
    colon: /^:/,
    escaped: /^\\./,
    brackets: /^\[[^\]]+(?<!\\)\]/,
    placeholder: /^(\$\{)(?:([0-9]+)|([_a-zA-Z][_a-zA-Z0-9]*))([:/])/,
    variable: /^(?:\$\{([_a-zA-Z][_a-zA-Z0-9]*)\}|\$([_a-zA-Z][_a-zA-Z0-9]*))/,
    tabstop: /^(?:\$\{([0-9]+)\}|\$([0-9]+))/,
    choices: /^(?:\$\{([0-9]+)\|([\s\S]+?)\|\})/,
    close_brace: /^\}/,
    newline: /^(\r?\n|\r)/,
    space: /^[^\S\n\r]+/,
    slash: /^\//,
    text: /^./,
  }
};
