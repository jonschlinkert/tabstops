'use strict';

require('mocha');
const path = require('path');
const assert = require('assert').strict;
const { parse, render } = require('../lib/Parser');
const data = {
  TM_DIRECTORY: __dirname,
  TM_FILENAME: 'parse.js',
  TM_FILEPATH: path.join(__dirname, 'parse.js')
};

const transforms = type => {
  return (input, options) => {
    return parse(input, options).find(type);
  };
};

const params = node => {
  return omit(node.params, ['replacers']);
};

const omit = (node, keys = []) => {
  let obj = {};
  for (let key of Object.keys(node)) {
    if (!keys.includes(key)) {
      obj[key] = node[key];
    }
  }
  return obj;
};

describe('tabstop transforms', () => {
  describe('.parse()', () => {
    const transform = transforms('tabstop_transform');

    it('should parse placeholder transforms', () => {
      const input = 'Foo ${1/./=/} Bar';
      const node = transform(input);
      assert.equal(input.slice(...node.loc.range), '${1/./=/}');
      assert.equal(node.stringify(), '${1/./=/}');
      assert.equal(node.inner(), '1/./=/');
    });

    it('should parse placeholder transforms with embedded regex characters', () => {
      const input = 'Foo ${1/[${1:.}/]/=/} Bar';
      const node = transform(input);
      assert.equal(input.slice(...node.loc.range), '${1/[${1:.}/]/=/}');
      assert.equal(node.stringify(), '${1/[${1:.}/]/=/}');
      assert.equal(node.inner(), '1/[${1:.}/]/=/');
    });

    it('should parse placeholder transforms with regex flags', () => {
      const input = 'Foo ${1/./=/gim} Bar';
      const node = transform(input);
      assert.equal(node.type, 'tabstop_transform');
      assert.equal(input.slice(...node.loc.range), '${1/./=/gim}');
      assert.equal(node.stringify(), '${1/./=/gim}');
      assert.equal(node.inner(), '1/./=/gim');
    });

    it('should parse format variable', () => {
      const input = 'Foo ${1/(.)/${1}/g} Bar';
      const node = transform(input);

      assert.equal(node.type, 'tabstop_transform');
      assert.equal(input.slice(...node.loc.range), '${1/(.)/${1}/g}');
      assert.equal(node.stringify(), '${1/(.)/${1}/g}');
      assert.equal(node.inner(), '1/(.)/${1}/g');
    });

    it('should use placeholder values', () => {
      const input = 'errorContext: `${1:err}`, error:${1/err/ok/}';
      assert.equal(render(input), 'errorContext: `err`, error:ok');
    });

    it('should parse format variable', () => {
      assert.deepEqual(params(transform('Foo ${1/(.)/${1}/g} Bar')), {
        type: 'tabstop_transform',
        varname: '1',
        regex: /(.)/g,
        format: '${1}',
        source: '(.)',
        string: '${1/(.)/${1}/g}',
        flags: 'g'
      });

      assert.deepEqual(params(transform('Foo ${1/(.)/${1:upcase}/g} Bar')), {
        type: 'tabstop_transform',
        string: '${1/(.)/${1:upcase}/g}',
        varname: '1',
        regex: /(.)/g,
        format: '${1:upcase}',
        source: '(.)',
        flags: 'g'
      });
    });
  });
});
