'use strict';

const regex = {};
regex.int = '([0-9]+)';
regex.ident = '((?:\\\\[^\\\\]|.)+?)';
// regex.ident = '([^:}]+?)';

// format ::= '$' int | '${' int '}'
//     | '${' int ':' '/upcase' | '/downcase' | '/capitalize' '}'
//     | '${' int ':+' if '}'
//     | '${' int ':?' if ':' else '}'
//     | '${' int ':-' else '}'
//     | '${' int ':' else '}'
// Examples:
// - '${1:?It is:It is not}'

regex.format = [
  `\\\$${regex.int}`,
  `\\\${${regex.int}(?:(:)?([-+?/])?${regex.ident}(?::${regex.ident})?)?}`,
];

module.exports = {
  // Format string regex
  REGEX_FORMAT_RE: new RegExp(`^(?:${regex.format.join('|')})(.*)$`),
  // REGEX_FORMAT_RE: /^\${?([0-9]+)(?::([-+?])?\/([_a-zA-Z][_a-zA-Z0-9]*))?}?(.*)$/,
  INSERTION_RE: /\(\?([0-9]+):(?:((?:\\.|.)+?))(?::((?:\\[^\\]|.)+?))?(?<!(?<!\\)\\)\)/,
  WHITESPACE_TABLE: { '\n': '\\n', '\r': '\\r', '\t': '\\t', '\v': '\\v', '\f': '\\f' },

  // Rules are defined as an array to guarantee order
  rules: [
    ['bom', /^\ufeff/],
    ['colon', /^:/],
    ['escaped', /^\\./],
    ['brackets', /^\[[^\]]+(?<!(?<!\\)\\)\]/],
    ['placeholder', /^(\$\{)(?:([0-9]+)|([_a-zA-Z][_a-zA-Z0-9]*))(:)(?=.*(?<!(?<!\\)\\)\})/],
    ['placeholder_transform', /^(\$\{)([0-9]+)(\/)(?=.*(?<!(?<!\\)\\)\})/],
    ['variable', /^(?:\$\{([_a-zA-Z][_a-zA-Z0-9]*)\}|\$([_a-zA-Z][_a-zA-Z0-9]*))/],
    ['variable_transform', /^(\$\{)([_a-zA-Z][_a-zA-Z0-9]*)(\/)(?=.*(?<!(?<!\\)\\)\})/],
    ['tabstop', /^(?:\$\{([0-9]+)\}|\$([0-9]+))/],
    ['choices', /^(?:\$\{([0-9]+)\|([\s\S]+?)(?<!(?<!\\)\\)\|\})/],
    ['close_brace', /^\}/],
    ['newline', /^(\r?\n|\r)/],
    ['slash', /^\//],

    // if nothing else is matched, the "text" rule will match
    // one-or-more of the characters on the left side of the
    // condition, or any single character.
    ['text', /^([-\w\s,!:;.@#%^&*()[\]]+|.)/]
  ]
};
