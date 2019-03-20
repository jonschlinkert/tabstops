'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../lib/parse');
const transform = async (input, options) => {
  let node = (await parse(input, options)).nodes[1];
  delete node.transform;
  delete node.value;
  delete node.type;
  return node;
};

describe('placeholder transforms - parse', () => {
  it('should parse placeholder transform snippets', async () => {
    assert.deepEqual(await transform('Foo ${1/./=/g} Bar'), {
      varname: '1',
      regex: /./g,
      format: '=',
      flags: 'g',
      nodes: [
        {
          type: 'text',
          value: '='
        }
      ]
    });
  });

  it('should parse format variable', async () => {
    assert.deepEqual(await transform('Foo ${1/(.)/${1}/g} Bar'), {
      varname: '1',
      regex: /(.)/g,
      format: '${1}',
      flags: 'g',
      nodes: [
        {
          type: 'tabstop',
          number: 1
        }
      ]
    });

    assert.deepEqual(await transform('Foo ${1/(.)/${1:upcase}/g} Bar'), {
      varname: '1',
      regex: /(.)/g,
      format: '${1:upcase}',
      flags: 'g',
      nodes: [
        {
          number: 1,
          placeholder: 'upcase',
          type: 'tabstop'
        }
      ]
    });
  });
});
