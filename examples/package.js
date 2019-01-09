'use strict';

console.time('total');
process.on('exit', () => console.timeEnd('total'));

const path = require('path');
const colors = require('ansi-colors');
const Compiler = require('../lib/compiler');
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


let compiler = new Compiler();
let isValue = val => val != null && val !== '';

compiler.handler('open', () => {});
compiler.handler('close', () => {});
compiler.handler('text', node => node.value);
compiler.handler('template', (node, context) => {
  if (node.render === false) {
    delete node.render;
    return '';
  }
  return compiler.mapVisit(node.nodes, context);
});

compiler.handler('variable', (node, context = {}) => {
  let idx = node.parent.nodes.indexOf(node);
  let nextSibling = node.parent.nodes[idx + 1];
  let nextValue;

  if (nextSibling && nextSibling.type === 'template') {
    nextValue = compiler.visit(nextSibling, context);
    nextSibling.render = false;

    if (isValue(nextValue, node)) {
      nextValue = colors.yellow(colors.unstyle(nextValue));
    }
  }

  let key = colors.cyan(`<${node.key}>`);
  node.placeholder = key;

  if (node.parent.parent.type !== 'root') {
    key = void 0;
  }

  let fallback = [node.value, nextValue, key].find(v => isValue(v, node));
  let value = [context[node.key], utils.get(context, node.key)].find(v => isValue(v, node));

  if (!isValue(value, node)) {
    value = fallback;
  }
  if (compiler.helpers[node.key]) {
    value = compiler.helpers[node.key](value, node);
  }

  if (value && nextValue) {
    value += nextValue
  }

  if (compiler.options.finalRender && value.includes(node.placeholder)) {
    value = value.split(node.placeholder).join('');
  }

  // console.log('node.value', [node.value])
  // console.log('next value', [nextValue])
  // console.log('     value', [value])
  // console.log('---')

  if (value === node.value) {
    return colors.magenta(value);
  }

  if (isValue(value, node)) {
    return colors.green(value);
  }

  return value;
});

const helpers = {
  keywords(value) {
    return '["' + value.split(/,\s*/).join('", "') + '"]';
  },
  author_email(value, node) {
    return value && value !== node.placeholder ? ` <${value}> ` : ' ';
  }
};

let ast = parse(pkg);
let fn = compiler.compile(ast, { helpers });

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
