'use strict';

console.time('total');
process.on('exit', () => console.timeEnd('total'));

const path = require('path');
const colors = require('ansi-colors');
const helpers = require('./support/helpers');
const compile = require('../lib/compile');
const parse = require('../lib/parse');

let pkg = `{
  "name": "\${1:name}",
  "description": "\${2:description=This is a description}",
  "version": "\${3:version=0.1.0}",
  "homepage1": "\${4:homepage}",
  "homepage2": "\${4:homepage=https://github.com/\${6:username}}",
  "author1": "\${5:author.name} (https://github.com/\${6:author.username})",
  "author2": "\${5:fullname} (https://github.com/\${6:username})",
  "repository1": "\${7:owner=\${6:author.username}}/\${1:name}",
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

let ast = parse(pkg);
let fn = compile(ast, { helpers });

const data = {
  name: 'picomatch',
  fullname: 'Jon Schlinkert',
  username: 'jonschlinkert',
  TM_FILEPATH: path.relative(process.cwd(), __filename),
  owner: 'micromatch',
  bar: 'XXX',
  baz: 'ZZZ',
  keywords: 'foo,bar,baz'
};

console.log(fn(data));
