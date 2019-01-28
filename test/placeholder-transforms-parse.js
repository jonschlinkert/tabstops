'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../lib/parse');
const transformCollated = str => {
  let node = parse(str, { collate: true }).nodes[1];
  let pick = ['varname', 'regex', 'format', 'flags', 'default'];
  let obj = {};
  for (let key of Object.keys(node)) {
    if (pick.includes(key)) {
      obj[key] = node[key];
    }
  }
  return obj;
};

describe('placeholder transforms - parse', () => {
  it('should parse placeholder transform snippets', () => {
    let transforms = str => parse(str).nodes[1].nodes.slice(1, -1);

    assert.deepEqual(transforms('Foo ${1/./=/g} Bar'), [
      { type: 'varname', value: '1' },
      { type: 'regex', value: '.' },
      { type: 'format', value: '=' },
      { type: 'flags', value: 'g' }
    ]);
  });

  it('should parse format variable', () => {
    assert.deepEqual(transformCollated('Foo ${1/(.)/${1}/g} Bar'), {
      varname: '1',
      regex: /(.)/g,
      format: '${1}',
      flags: 'g'
    });

    assert.deepEqual(transformCollated('Foo ${1/(.)/${1:upcase}/g} Bar'), {
      varname: '1',
      regex: /(.)/g,
      format: '${1:upcase}',
      flags: 'g'
    });
  });

  it('should parse and collate placeholder transform snippets', () => {
    let ast = transformCollated('Foo ${1/./=/g} Bar', { collate: true });
    assert.deepEqual(ast, {
      varname: '1',
      regex: /./g,
      format: '=',
      flags: 'g'
    });
  });
});
