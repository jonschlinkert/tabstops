'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../lib/parse');
const transform = input => {
  let node = parse(input).nodes[1];
  delete node.transform;
  delete node.value;
  delete node.type;
  return node;
};

describe('placeholder transforms - parse', () => {
  it('should parse placeholder transform snippets', () => {
    assert.deepEqual(transform('Foo ${1/./=/g} Bar'), {
      varname: '1',
      regex: /./g,
      format: '=',
      flags: 'g',
      groups: [
        {
          type: 'text',
          value: '='
        }
      ]
    });
  });

  it('should parse format variable', () => {
    assert.deepEqual(transform('Foo ${1/(.)/${1}/g} Bar'), {
      varname: '1',
      regex: /(.)/g,
      format: '${1}',
      flags: 'g',
      groups: [
        {
          type: 'match',
          group: 1
        }
      ]
    });

    assert.deepEqual(transform('Foo ${1/(.)/${1:upcase}/g} Bar'), {
      varname: '1',
      regex: /(.)/g,
      format: '${1:upcase}',
      flags: 'g',
      groups: [
        {
          group: 1,
          placeholder: 'upcase',
          type: 'match'
        }
      ]
    });
  });
});
