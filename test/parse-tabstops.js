'use strict';

require('mocha');
const assert = require('assert').strict;
const parse = require('../lib/parse');

describe('tabstops - parse', () => {
  it('should parse a tabstop', async () => {
    assert.deepEqual(await parse('foo $1 bar'), {
      type: 'root',
      input: 'foo $1 bar',
      nodes: [
        { type: 'text', line: 1, value: 'foo ' },
        { type: 'tabstop', open: '$', close: '', line: 1, number: 1 },
        { type: 'text', line: 1, value: ' bar' }
      ]
    });

    assert.deepEqual(await parse('<div$1> $0 </div>'), {
      type: 'root',
      input: '<div$1> $0 </div>',
      nodes: [
        { type: 'text', line: 1, value: '<div' },
        { type: 'tabstop', open: '$', close: '', line: 1, number: 1 },
        { type: 'text', line: 1, value: '> ' },
        { type: 'tabstop', open: '$', close: '', line: 1, number: 0 },
        { type: 'text', line: 1, value: ' </div>' }
      ]
    });
  });

  it('should parse multiple tabstops', async () => {
    assert.deepEqual(await parse('foo $1$2$3 qux'), {
      type: 'root',
      input: 'foo $1$2$3 qux',
      nodes: [
        { type: 'text', line: 1, value: 'foo ' },
        { type: 'tabstop', open: '$', close: '', line: 1, number: 1 },
        { type: 'tabstop', open: '$', close: '', line: 1, number: 2 },
        { type: 'tabstop', open: '$', close: '', line: 1, number: 3 },
        { type: 'text', line: 1, value: ' qux' }
      ]
    });

    assert.deepEqual(await parse('foo $1 bar $2 baz $3 qux'), {
      type: 'root',
      input: 'foo $1 bar $2 baz $3 qux',
      nodes: [
        { type: 'text', line: 1, value: 'foo ' },
        { type: 'tabstop', open: '$', close: '', line: 1, number: 1 },
        { type: 'text', line: 1, value: ' bar ' },
        { type: 'tabstop', open: '$', close: '', line: 1, number: 2 },
        { type: 'text', line: 1, value: ' baz ' },
        { type: 'tabstop', open: '$', close: '', line: 1, number: 3 },
        { type: 'text', line: 1, value: ' qux' }
      ]
    });
  });

  it('should parse a tabstop in a template literal', async () => {
    let ast = await parse('foo ${1} bar');

    assert.deepEqual(ast, {
      type: 'root',
      input: 'foo ${1} bar',
      nodes: [
        { type: 'text', line: 1, value: 'foo ' },
        { type: 'tabstop', open: '${', close: '}', line: 1, number: 1 },
        { type: 'text', line: 1, value: ' bar' }
      ]
    });
  });

  it('should parse multiple tabstops in template literals', async () => {
    let ast = await parse('foo ${1} bar ${2} baz');

    assert.deepEqual(ast, {
      type: 'root',
      input: 'foo ${1} bar ${2} baz',
      nodes: [
        { type: 'text', line: 1, value: 'foo ' },
        { type: 'tabstop', open: '${', close: '}', line: 1, number: 1 },
        { type: 'text', line: 1, value: ' bar ' },
        { type: 'tabstop', open: '${', close: '}', line: 1, number: 2 },
        { type: 'text', line: 1, value: ' baz' }
      ]
    });
  });

  it('should parse nested tabstops', async () => {
    let ast = await parse('foo ${1:${2}} bar');
    assert.deepEqual(ast, {
      type: 'root',
      input: 'foo ${1:${2}} bar',
      nodes: [
        { type: 'text', line: 1, value: 'foo ' },
        {
          type: 'tabstop',
          open: '${',
          close: '}',
          number: 1,
          line: 1,
          nodes: [{ type: 'tabstop', open: '${', close: '}', line: 1, number: 2 }]
        },
        { type: 'text', line: 1, value: ' bar' }
      ]
    });
  });
});
