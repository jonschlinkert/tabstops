'use strict';

require('mocha');
const assert = require('assert').strict;
const parse = require('../lib/parse');
const transform = async (input, options) => {
  let node = (await parse(input, options)).nodes[1];
  delete node.transform;
  return node;
};

describe('placeholder transforms - parse', () => {
  it('should parse placeholder transform snippets', async () => {
    assert.deepEqual(await transform('Foo ${1/./=/g} Bar'), {
      type: 'transform',
      value: '1/./=/g',
      varname: '1',
      regex: /./g,
      format: '=',
      flags: 'g',
      nodes: [
        {
          type: 'text',
          value: '=',
          line: 1
        }
      ]
    });
  });

  it('should parse format variable', async () => {
    assert.deepEqual(await transform('Foo ${1/(.)/${1}/g} Bar'), {
      type: 'transform',
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

    assert.deepEqual(await transform('Foo ${1/(.)/${1:upcase}/g} Bar'), {
      type: 'transform',
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
