'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../lib/parse');
const format = require('./support/format');

describe('variables - parse', () => {
  it('should parse a variable', () => {
    assert.deepEqual(parse('foo $TM_FILEPATH bar'), {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        {
          type: 'tabstop',
          stop: null,
          placeholder: 'TM_FILEPATH',
          nodes: []
        },
        { type: 'text', value: ' bar' }
      ]
    });

    assert.deepEqual(parse('foo $TM_FILEPATH bar', { collate: true }), {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        {
          type: 'tabstop',
          stop: null,
          placeholder: 'TM_FILEPATH',
          nodes: []
        },
        { type: 'text', value: ' bar' }
      ]
    });
  });

  it('should parse an alphanumeric tabstop variable', () => {
    let ast = parse('foo $FOO123BAR bar');

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        {
          type: 'tabstop',
          stop: null,
          placeholder: 'FOO123BAR',
          nodes: []
        },
        { type: 'text', value: ' bar' }
      ]
    });
  });

  it('should parse and collate an alphanumeric tabstop variable', () => {
    let ast = parse('foo $FOO123BAR bar', { collate: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        {
          type: 'tabstop',
          stop: null,
          placeholder: 'FOO123BAR',
          nodes: []
        },
        { type: 'text', value: ' bar' }
      ]
    });
  });

  it('should correctly deal non-terminator right brace', () => {
    let ast = parse('foo $FOO123BAR} bar', { collate: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        {
          type: 'tabstop',
          stop: null,
          placeholder: 'FOO123BAR',
          nodes: []
        },
        { type: 'text', value: '} bar' }
      ]
    });
  });

  it('should correctly deal with escaped right brace', () => {
    let ast = parse('foo $FOO123BAR\\} bar', { collate: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        {
          type: 'tabstop',
          stop: null,
          placeholder: 'FOO123BAR',
          nodes: []
        },
        { type: 'text', value: '\\} bar' }
      ]
    });
  });
});
