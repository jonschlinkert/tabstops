'use strict';

const Scope = require('../Scope');
const Parser = require('../Parser');
const {
  Placeholder,
  PlaceholderTransform,
  Tabstop,
  Variable,
  VariableTransform
} = require('../nodes');

const capture = lexer => {
  // lexer.on('capture', console.log);
  lexer.capture('colon', /^:/);
  lexer.capture('escaped', /^\\./);
  lexer.capture('brackets', /^\[[^\]]+(?<!\\)\]/);
  lexer.capture('placeholder', /^(\$\{)(?:([0-9]+)|([_a-zA-Z][_a-zA-Z0-9]*))([:/])/);
  // lexer.capture('placeholder', /^(\$\{)(?:([0-9]+)|([_a-zA-Z][_a-zA-Z0-9]*))(:|\/(?![-?+]))(?:(\/)([-?+])([_a-zA-Z][_a-zA-Z0-9]*))?/);
  lexer.capture('variable', /^(?:\$\{([_a-zA-Z][_a-zA-Z0-9]*)\}|\$([_a-zA-Z][_a-zA-Z0-9]*))/);
  lexer.capture('tabstop', /^(?:\$\{([0-9]+)\}|\$([0-9]+))/);
  lexer.capture('close_brace', /^\}/);
  lexer.capture('newline', /^(\r?\n|\r)/);
  lexer.capture('space', /^[^\S\n\r]+/);
  lexer.capture('slash', /^\//);
  // lexer.capture('text', /^(\\\$\{|(?<!\$)\{|\$(?![0-9])|[^$\s}[\]:/\\]+)/);
  lexer.capture('text', /^./);
  return lexer;
};

const parse = (input, tabstops = new Map()) => {
  const parser = new Parser(input);
  const lexer = capture(parser.lexer);

  parser
    .handler('brackets', node => {
      node.type = 'text';
      return node;
    })
    .handler('escaped', node => {
      node.type = 'text';
      return node;
    })
    .handler('space', node => {
      node.type = 'text';
      return node;
    })
    .handler('colon', node => {
      if (parser.block.type === 'root' || parser.isInsideScope()) {
        node.type = 'text';
      }
      return node;
    })
    .handler('slash', node => {
      if (parser.isInsideScope()) {
        parser.block.slashes = (parser.block.slashes || 0) + 1;
      }
      return node;
    })
    .handler('newline', node => {
      lexer.loc.line++;
      return node;
    })
    .handler('variable', node => {
      return new Variable(node);
    })
    .handler('tabstop', node => {
      if (parser.isInsideScope()) {
        node.type = 'text';
        return node;
      }

      node.tabstops = tabstops;
      return new Tabstop(node);
    })
    .handler('placeholder', node => {
      let [, open, stop, variable, delim] = node.match;
      let block;

      if (stop && (!delim || delim === ':')) {
        block = new Tabstop({ nodes: [], tabstops, match: node.match });
        block.tabstop = Number(stop);
      }

      if (stop && delim === '/') {
        block = new PlaceholderTransform({ tabstops });
        block.tabstop = Number(stop);
        parser.pushScope(new Scope({ type: block.type, blocks: [block] }));
      }

      if (!stop && delim === ':') {
        block = new Placeholder({ tabstops });
        block.variable = variable;
      }

      if (!stop && delim === '/') {
        block = new VariableTransform();
        block.variable = variable;
        parser.pushScope(new Scope({ type: block.type, blocks: [block] }));
      }

      node.type = 'open_brace';
      node.value = open;
      node.output = '';

      parser.push(block);
      return node;
    })
    .handler('close_brace', node => {
      node.close = true;
      node.output = '';
      return node;
    })
    .handler('text', node => node);

  return parser.parse();
};

// console.log(parser.scope);

const snippets = {
  placeholder: [
    'foo: ${1:Jon Schlinkert} baz',
    'foo: ${1:$TM_FILENAME} baz',
    'foo: ${1:${TM_FILENAME}} baz',
    'foo: ${1:${username:jonschlinkert}} baz',
    '${1:${FOO:abc$2def}}'
  ],
  placeholder_transform: [
    // 'foo ${1:${SomeClass/([${.}]+)\\..+|.*/$1/g:ComponentName}}bar$0',
    // 'foo ${1:${1/([${.}]+)\\..+|.*/$1/g:ComponentName}}bar$0',
    // 'foo ${1:${1/([${.}]+)\\..+|.*/$1/ComponentName}}bar$0',
    // 'foo ${1:${1/([${.}]+)\\..+|.*/$1/g}}bar$0',
    // 'const stem = "${TM_FILENAME/(.*)\\..+$/$1/i}";',
    // 'foo ${1:${TM_FILENAME/^(.)|(?:-(.))|(\\.js)/${1:+/upcase}${2:+/upcase}/g}}bar$0',
    // 'foo ${1:${TM_FILENAME/^([${.}])|(?:-([${.}]))|(\\.js)/${1:?/upcase}${2:-/upcase}/g}}bar$0',
    // '${1:name} : ${2:type}${3/\\s:=(.*)/${4:+ :=}${1}/};\n$0',
    // 'class ${1:${TM_FILENAME/(?:\\A|_)([A-Za-z0-9]+)(?:\\.rb)?/(?2::\\u$1)/g}} < ${2:Application}Controller\n  $3\nend',
    // '${1/(void$)|(.+)/${1:?-\treturn nil;}/}'
  ],
  tabstop: [
    'foo: $1 baz',
    'foo: ${1} baz'
  ],
  variable: [
    'foo $name bar',
    'foo ${name:default} bar',
    'foo: ${name:Jon Schlinkert} baz',
    'foo: ${name:${username}} bar ${1:Jon Schlinkert} baz ${name:${missing}}'
  ],
  variable_transform: [
    'foo ${TM_FILENAME/^_?(.+)\\..+$/$1/g}bar$0',
    'foo ${TM_FILENAME/^_?(.+)\\..+$/${1:+/upcase}${1:+/downcase}/g} bar$0'

    // === INVALID ===
    // 'foo ${SomeClass/([${.}]+)\\..+|.*/$1/g:ComponentName}bar$0',
    // 'foo ${TM_FILENAME/^(.)|(?:-(.))|(\\.js)/${1:+/upcase}${2:+/upcase}/g} bar$0',
    // 'foo ${TM_FILENAME/^([${.}])|(?:-([${.}]))|(\\.js)/${1:?/upcase}${1:-/upcase}/g} bar$0',
    // 'class ${TM_FILENAME/(?:\\A|_)([A-Za-z0-9]+)(?:\\.rb)?/(?2::\\u$1)/g} < ${2:Application}Controller\n  $3\nend',
  ]
};

let isValue = value => value != null && value !== '';
let tabstops = new Map();
let helpers = {
  upcase(str) {
    return str.toUpperCase();
  },
  downcase(str) {
    return str.toLowerCase();
  }
};

let options = { tabstops, isValue, helpers };
let keys = Object.keys(snippets);
let type = keys[4];

console.log('Parsing:', [type]);
console.log();

for (let ele of snippets[type]) {
  let ast = parse(ele);
  // console.log(ast.nodes[1]);
  // console.log(ast.nodes[1].nodes[1].nodes[3]);

  // tabstops.set(1, 'One');
  // tabstops.set(2, 'Two');
  // tabstops.set(3, 'Three');
  tabstops.set(0, 'The Last Stop');

  let context = { _name: 'Brian Woodward', username: 'jonps', TM_FILENAME: '_foo.txt' };
  let fn = ast.compile(options);
  console.log(fn(context));
}

