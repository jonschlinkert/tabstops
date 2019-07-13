'use strict';

console.time('total');
process.on('exit', () => console.timeEnd('total'));

const path = require('path');
const colors = require('ansi-colors');
const helpers = require('./support/helpers');
const compile = require('../lib/compile');
const parse = require('../lib/parse');

// let pkg = `\${1:one:\${1:two:\${3:three:\${4:four:\${5:five:\${6:six:This is a description}}}}}}`;
// let pkg = `"\${3:description=\${4:desc:This is a description}}"
// "\${3:description=\${This is a description}}"`;
// let pkg = `{
//   "name": "\${1:name}",
//   "owner": "\${2:owner}",

//   "foo": "\${foo}",
//   "bar": "\${bar}",
//   "baz": "\${baz}",
//   "qux": "\${qux}",
//   "baz:qux": "\${baz:qux\${qux}}",
//   "qux:fez": "\${qux:fezzz}",

//   "description": "\${description=This is a description}",
//   "description": "\${3:description=This is a description}",
//   "description": "\${3:description=\${4:desc:This is a description}}",
//   "homepage": "\${4:homepage}",

//   "homepage": "\${4:\${homepage=https://github.com/\${6:username}}}",
//   "homepage": "\${4:\${homepage=https://github.com/\${6:owner}/\${6:name}}}",
//   "homepage": "\${4:homepage=https://github.com/\${6:username}}",

//   "homepage": "\${4:homepage=https://github.com/aaa/bbb}",
//   "homepage": "\${4:homepage1=https://github.com/aaa/bbb}",
//   "homepage": "\${4:homepage1=https://github.com/\${6:owner}1/\${6:name}2}",
//   "homepage": "\${4:\${homepage1=https://github.com/\${6:owner}/\${6:name}}}",
// }`;

let pkg = `{
  "name": "\${1:name}",
  "description": "\${2:description=This is a description}",
  "version": "\${3:version=0.1.0}",
  "homepage1": "\${4:homepage}",
  "homepage2": "\${4:homepage=https://github.com/\${6:username}}",
  "author1": "\${5:author.name} (https://github.com/\${6:author.username})",
  "author2": "\${5:fullname} (https://github.com/\${6:username})",
  "repository1": "\${7:\${owner=\${6:author.username}}}/\${1:name}",
  "repository2": "\${7:owner=\${6:username}}/\${1:name}",
  "bugs": {
    "url": "https://github.com/\${7:owner=\${6:username=\${bar=\${baz}}}}/\${1:name}/issues",
    "url2": "https://github.com/\${7:owner=\${6:author.foo=\${bar=\${baz}}}}/\${1:name}/issues"
  },
  "files": "$TM_FILEPATH",
  "engines": {
    "node": ">=\${8:engine=10}"
  },
  "license": "\${9:license=MIT}",
  "scripts": {
    "test": "mocha"
  },
  "keywords": \${10:keywords},
  "almost_a_template": "\${{{$}}:foo}", // shouldn't do anything
  "almost_another_template": "\\\${{{$}:foo}}" // shouldn't do anything
}`;

(async() => {

let ast = await parse(pkg);
let fn = await compile(ast, {
  placeholders: true,
  debug: true,
  helpers,
  data: {
    name: 'enquirer',
    owner: 'enquirer',
    homepage1: 'https://github.com/foo/bar',
    username: 'enquirer',
    description: require('../package').description,
    author: { name: 'Jon Schlinkert', username: 'jonschlinkert' },
    TM_FILEPATH: path.relative(process.cwd(), __filename)
  }
});

// console.log(fn({ owner: 'enquirer' }));
console.log(await fn({
  foo: 'XXX',
  bar: 'YYY',
  baz: 'ZZZ'
}));

})().catch(console.error);
