'use strict';

console.time('total');
process.on('exit', () => console.timeEnd('total'));

const path = require('path');
const colors = require('ansi-colors');
const helpers = require('./support/helpers');
const compile = require('../lib/compile');
const utils = require('../lib/utils');
const parse = require('../lib/parse');

// let pkg = `\${1:repository_bugs_url=https\\://github.com/\${2:repository_owner}/\${3:package_name}}`;
// let pkg = `\${7:name=$other}`;

let pkg = `{
  "name": "\${1:package_name}",
  "description": "\${2:package_description}",
  "version": "\${3:package_version=0.1.0}",
  "homepage": "\${4:homepage=https\\://github.com/\${5:repository_owner}/\${1:package_name}}",
  "author": "\${6:author_fullname}\${7:author_email}(https://github.com/\${6:author_username})",
  "repository": "\${5:repository_owner=\${author_username}}/\${1:package_name}",
  "bugs": {
    "url": "\${7:repository_bugs_url=https\\://github.com/\${5:repository_owner}/\${1:package_name}/issues}"
  },
  "engines": {
    "node": ">=\${8:engine=8}"
  },
  "license": "\${9:license=MIT}",
  "scripts": {
    "test": "mocha"
  },
  "keywords": "\${10:keywords}"
}
`;

// package_version
// package_license
// repository_owner
// author_fullname
// author_username
// bugs_url
// node_engine
// scripts_test

// homepage_hostname
// homepage_protocol
// homepage_pathname
// homepage = ${homepage_protocol}://${homepage_hostname=repository_owner}/${homepage_path}

let ast = parse(pkg);
let fn = compile(ast, { helpers, debug: true });

const data = {
  foo: 'bar',
  package_name: 'enquirer',
  repository_owner: 'jonschlinkert',
  // repository_bugs_url: 'https://github.com/enquirer/issues',
  author_fullname: 'Jon Schlinkert',
  author_username: 'jonschlinkert',
  // author_email: 'jon.schlinkert@sellside.com',
  TM_FILEPATH: path.relative(process.cwd(), __filename),
  bar: 'XXX',
  baz: 'ZZZ',
  keywords: 'foo,bar,baz',
  finalRender: true
};

console.log(fn(data));
