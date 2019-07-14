'use strict';

require('mocha');
const assert = require('assert').strict;
const Snippet = require('../lib/Snippet');
const parse = input => {
  const snippet = new Snippet(input);
  return snippet.parse();
};

const cleanup = node => {
  node.range = node.loc.range;
  delete node.transform;
  delete node.tabstops;
  delete node.source;
};

const transforms = type => {
  return (input, options) => parse(input, options).find(type);
};

describe('transforms', () => {
  describe('placeholder_transform - parse', () => {
    const transform = transforms('placeholder_transform');

    it('should parse placeholder transforms', () => {
      const input = 'Foo ${1/./=/} Bar';
      const node = transform(input);
      assert.equal(input.slice(...node.loc.range), '${1/./=/}');
      assert.equal(node.outer(), '${1/./=/}');
      assert.equal(node.inner(), '1/./=/');
    });

    it('should parse placeholder transforms with embedded regex characters', () => {
      const input = 'Foo ${1/[${1:.}/]/=/} Bar';
      const node = transform(input);
      assert.equal(input.slice(...node.loc.range), '${1/[${1:.}/]/=/}');
      assert.equal(node.outer(), '${1/[${1:.}/]/=/}');
      assert.equal(node.inner(), '1/[${1:.}/]/=/');
    });

    it('should parse placeholder transforms with regex flags', () => {
      const input = 'Foo ${1/./=/gim} Bar';
      const node = transform(input);
      assert.equal(input.slice(...node.loc.range), '${1/./=/gim}');
      assert.equal(node.outer(), '${1/./=/gim}');
      assert.equal(node.inner(), '1/./=/gim');
    });

    it('should parse format variable', () => {
      const input = 'Foo ${1/(.)/${1}/g} Bar';
      const node = transform(input);
      assert.equal(input.slice(...node.loc.range), '${1/(.)/${1}/g}');
      assert.equal(node.outer(), '${1/(.)/${1}/g}');
      assert.equal(node.inner(), '1/(.)/${1}/g');
    });

    it.skip('should parse format variable', () => {
      assert.deepEqual(transform('Foo ${1/(.)/${1}/g} Bar'), {
        type: 'placeholder_transform',
        value: '1/(.)/${1}/g',
        varname: '1',
        regex: /(.)/g,
        format: '${1}',
        flags: 'g',
        nodes: [
          {
            type: 'tabstop',
            open: '${',
            close: '}',
            line: 1,
            number: 1
          }
        ]
      });

      assert.deepEqual(transform('Foo ${1/(.)/${1:upcase}/g} Bar'), {
        type: 'placeholder_transform',
        value: '1/(.)/${1:upcase}/g',
        varname: '1',
        regex: /(.)/g,
        format: '${1:upcase}',
        flags: 'g',
        nodes: [
          {
            number: 1,
            line: 1,
            placeholder: 'upcase',
            type: 'tabstop',
            open: '${',
            close: '}'
          }
        ]
      });
    });
  });
});
