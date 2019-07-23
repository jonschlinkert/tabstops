'use strict';

const Snippet = require('../Snippet');

const snippets = {
  // choices: [
  //   '${2|one,"two,three"|}',
  //   '${2|one,two,three|}'
  // ],
  placeholder: [
    'foo: ${1:Jon Schlinkert} baz',
    'foo: ${2:$TM_FILENAME} baz',
    'foo: ${3:${TM_FILENAME}} baz',
    'foo: ${4:${username:jonschlinkert}} baz',
    '${1:${FOO:abc$2def}}'
  ],
  placeholder_transform: [
    'foo ${1:${SomeClass/([${.}]+)\\..+|.*/$1/g:ComponentName}}bar$0',
    'foo ${1:${1/([${.}]+)\\..+|.*/$1/g:ComponentName}}bar$0',
    'foo ${1:${1/([${.}]+)\\..+|.*/$1/ComponentName}}bar$0',
    'foo ${1:${1/([${.}]+)\\..+|.*/$1/g}}bar$0',
    'const stem = "${TM_FILENAME/(.*)\\..+$/$1/i}";',
    'foo ${1:${TM_FILENAME/^(.)|(?:-(.))|(\\.js)/${1:+/upcase}${2:+/upcase}/g}}bar$0',
    'foo ${1:${TM_FILENAME/^([${.}])|(?:-([${.}]))|(\\.js)/${1:?/upcase}${2:-/upcase}/g}}bar$0',
    '${1:name} : ${2:type}${3/\\s:=(.*)/${4:+ :=}${1}/};\n$0',
    'class ${1:${TM_FILENAME/(?:\\A|_)([A-Za-z0-9]+)(?:\\.txt)?/(?2::\\u$1)/g}} < ${2:Application}Controller\n  $3\nend',
    '${1/(void$)|(.+)/${1:?-\treturn nil;}/}'
  ],
  tabstop: [
    'foo: $1 baz',
    'foo: $1 $2 $3 baz',
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

const util = require('util');

let isValue = value => value != null && value !== '';
let options = { isValue };
let keys = Object.keys(snippets);
let type = keys[0];

for (let key of Object.keys(snippets)) {
  // console.log();
  // console.log('=== Parsing:', key, 'snippets ===');

  for (let ele of snippets[key]) {
    let snippet = new Snippet(ele);
    let ast = snippet.parse();
    // console.log(ast.nodes[1].nodes[1])
    // console.log([ele.slice(...ast.loc.range)]);
    // console.log([ast.stringify()]);
    // // console.log([ast.outer()]);
    // console.log();
    // console.log('---', [ele]);
    // console.log(ast.nodes[1].nodes[1].nodes[3]);

    snippet.tabstops.set(1, 'One');
    snippet.tabstops.set(2, 'Two');
    snippet.tabstops.set(3, 'Three');
    snippet.tabstops.set(4, 'Four');
    snippet.tabstops.set(0, 'The Last Stop');

    let context = { _name: 'Brian Woodward', username: 'jonps', TM_FILENAME: '_foo.txt' };
    let fn = ast.compile(options);
    console.log(fn(context));
  }
}
