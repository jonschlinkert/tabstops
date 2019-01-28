'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../lib/parse');

describe('tabstops - parse', () => {
  it('should parse a tabstop', () => {
    assert.deepEqual(parse('foo $1 bar'), {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'tabstop', number: 1, nodes: [] },
        { type: 'text', value: ' bar' }
      ]
    });
  });

  it('should parse multiple tabstops', () => {
    let ast = parse('foo $1 bar $2 baz $3 qux');

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'tabstop', number: 1, nodes: [] },
        { type: 'text', value: ' bar ' },
        { type: 'tabstop', number: 2, nodes: [] },
        { type: 'text', value: ' baz ' },
        { type: 'tabstop', number: 3, nodes: [] },
        { type: 'text', value: ' qux' }
      ]
    });
  });

  it('should parse a tabstop in a template literal', () => {
    let ast = parse('foo ${1} bar');

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'tabstop', number: 1, nodes: [] },
        { type: 'text', value: ' bar' }
      ]
    });
  });

  it('should parse multiple tabstops in template literals', () => {
    let ast = parse('foo ${1} bar ${2} baz');

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'tabstop', number: 1, nodes: [] },
        { type: 'text', value: ' bar ' },
        { type: 'tabstop', number: 2, nodes: [] },
        { type: 'text', value: ' baz' }
      ]
    });
  });

  it('should parse nested tabstops', () => {
    let ast = parse('foo ${1:${2}} bar');
    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        {
          type: 'tabstop',
          number: 1,
          nodes: [{ type: 'tabstop', number: 2, nodes: [] }]
        },
        { type: 'text', value: ' bar' }
      ]
    });
  });
});
