'use strict';

console.time('total');
process.on('exit', () => console.timeEnd('total'));

const path = require('path');
const colors = require('ansi-colors');
const Compiler = require('../lib/compiler');
const utils = require('../lib/utils');
const parse = require('../lib/parse');

let pkg = `{
  "name": "\${1:name}",
  "description": "\${2:description=This is a description}",
  "version": "\${3:version=0.1.0}",
  "homepage": "\${4:homepage=https\\://github.com/\${6:username}}",
  "author": "\${5:fullname} (https://github.com/\${6:username})",
  "repository": "\${7:owner=\${6:username}}/\${1:name}",
  "bugs": {
    "url": "https://github.com/\${7:owner=\${6:username=\${bar=\${baz}}}}/\${1:name}/issues"
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
  "almost_a_template": "\${{{$}}:foo}" // shouldn't do anything
}`;


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
  let sibling = node.parent.nodes[idx + 1];
  let nextValue;

  if (sibling.type === 'template') {
    nextValue = compiler.visit(sibling, context);
    sibling.render = false;

    if (isValue(nextValue, node)) {
      nextValue = colors.yellow(colors.unstyle(nextValue));
    }
  }

  let key = colors.cyan(`<${node.key}>`);
  if (node.parent.parent.type !== 'root') {
    key = void 0;
  }

  let fallback = [node.value, nextValue, key].find(v => isValue(v, node));
  let value = utils.get(context, node.key);

  if (!isValue(value, node)) {
    value = fallback;
  }

  if (compiler.helpers[node.key]) {
    value = compiler.helpers[node.key](value, node);
  }

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
  }
};

let ast = parse(pkg);
let fn = compiler.compile(ast, { helpers });

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
