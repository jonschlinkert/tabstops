'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../lib/parse');
const format = require('./support/format');

describe('variables - parse', () => {
  it('should parse a variable', async () => {
    assert.deepEqual(await parse('foo $TM_FILEPATH bar'), {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'variable', value: 'TM_FILEPATH' },
        { type: 'text', value: ' bar' }
      ]
    });

    assert.deepEqual(await parse('foo $TM_FILEPATH bar'), {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'variable', value: 'TM_FILEPATH' },
        { type: 'text', value: ' bar' }
      ]
    });
  });

  it('should parse an alphanumeric tabstop variable', async() => {
    let ast = await parse('foo $FOO123BAR bar', { tokens: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'variable', value: 'FOO123BAR' },
        { type: 'text', value: ' bar' }
      ],
      tokens: [
        { type: 'text', value: 'foo ' },
        { type: 'variable', value: 'FOO123BAR' },
        { type: 'text', value: ' bar' }
      ]
    });
  });

  it('should parse an alphanumeric tabstop variable', async () => {
    let ast = await parse('foo $FOO123BAR bar', { tokens: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'variable', value: 'FOO123BAR' },
        { type: 'text', value: ' bar' }
      ],
      tokens: [
        { type: 'text', value: 'foo ' },
        { type: 'variable', value: 'FOO123BAR' },
        { type: 'text', value: ' bar' }
      ]
    });
  });

  it('should correctly deal non-terminator right brace', async () => {
    let ast = await parse('foo $FOO123BAR} bar', { tokens: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'variable', value: 'FOO123BAR' },
        { type: 'text', value: '} bar' }
      ],
      tokens: [
        { type: 'text', value: 'foo ' },
        { type: 'variable', value: 'FOO123BAR' },
        { type: 'text', value: '} bar' }
      ]
    });
  });

  it('should correctly deal with escaped right brace', async () => {
    let ast = await parse('foo $FOO123BAR\\} bar', { tokens: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'variable', value: 'FOO123BAR' },
        { type: 'text', value: '\\} bar' }
      ],
      tokens: [
        { type: 'text', value: 'foo ' },
        { type: 'variable', value: 'FOO123BAR' },
        { type: 'text', value: '\\} bar' }
      ]
    });
  });

  it('should add line numbers when enabled', async () => {
    let ast = await parse('foo $FOO123BAR\\}\nbar\n$BAZ', { lines: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ', line: 1 },
        { type: 'variable', value: 'FOO123BAR', line: 1 },
        { type: 'text', value: '\\}\nbar\n', line: 1 },
        { type: 'variable', value: 'BAZ', line: 3 }
      ]
    });
  });
});
