'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../lib/parse');
const format = require('./support/format');

describe('tabstops - parse', () => {
  it('should parse a tabstop', () => {
    assert.deepEqual(parse('foo $1 bar'), {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        {
          type: 'tabstop',
          stop: 1,
          placeholder: '',
          nodes: [
            {
              type: 'open',
              value: '$'
            }
          ]
        },
        { type: 'text', value: ' bar' }
      ]
    });
  });

  it('should parse and collate a tabstop', () => {
    assert.deepEqual(parse('foo $1 bar', { collate: true }), {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        {
          type: 'tabstop',
          stop: 1,
          placeholder: '',
          open: '$',
          nodes: []
        },
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
        {
          type: 'tabstop',
          stop: 1,
          placeholder: '',
          nodes: [
            { type: 'open', value: '$' }
          ]
        },
        { type: 'text', value: ' bar ' },
        {
          type: 'tabstop',
          stop: 2,
          placeholder: '',
          nodes: [
            { type: 'open', value: '$' }
          ]
        },
        { type: 'text', value: ' baz ' },
        {
          type: 'tabstop',
          stop: 3,
          placeholder: '',
          nodes: [
            { type: 'open', value: '$' }
          ]
        },
        { type: 'text', value: ' qux' }
      ]
    });
  });

  it('should parse and collate multiple tabstops', () => {
    let ast = parse('foo $1 bar $2 baz $3 qux', { collate: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        {
          type: 'tabstop',
          stop: 1,
          placeholder: '',
          open: '$',
          nodes: []
        },
        { type: 'text', value: ' bar ' },
        {
          type: 'tabstop',
          stop: 2,
          placeholder: '',
          open: '$',
          nodes: []
        },
        { type: 'text', value: ' baz ' },
        {
          type: 'tabstop',
          stop: 3,
          placeholder: '',
          open: '$',
          nodes: []
        },
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
        { type: 'tabstop', stop: 1, placeholder: '', nodes: [] },
        { type: 'text', value: ' bar' }
      ]
    });
  });

  it('should parse and collate a tabstop in a template literal', () => {
    let ast = parse('foo ${1} bar', { collate: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'tabstop', stop: 1, placeholder: '', nodes: [] },
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
        { type: 'tabstop', stop: 1, placeholder: '', nodes: [] },
        { type: 'text', value: ' bar ' },
        { type: 'tabstop', stop: 2, placeholder: '', nodes: [] },
        { type: 'text', value: ' baz' }
      ]
    });
  });

  it('should parse and collate multiple tabstops in template literals', () => {
    let ast = parse('foo ${1} bar ${2} baz', { collate: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'tabstop', stop: 1, placeholder: '', nodes: [] },
        { type: 'text', value: ' bar ' },
        { type: 'tabstop', stop: 2, placeholder: '', nodes: [] },
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
          stop: 1,
          placeholder: '',
          nodes: [
            {
              type: 'open',
              value: '${'
            },
            { type: 'tabstop', stop: 2, placeholder: '', nodes: [] },
            {
              type: 'close',
              value: '}'
            }
          ]
        },
        { type: 'text', value: ' bar' }
      ]
    });
  });

  it('should parse and collate nested tabstops', () => {
    let ast = parse('foo ${1:${2}} bar', { collate: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [

        { type: 'text', value: 'foo ' },
        {
          type: 'tabstop',
          stop: 1,
          placeholder: '',
          open: '${',
          close: '}',
          nodes: [
            { type: 'tabstop', stop: 2, placeholder: '', nodes: [] }
          ]
        },
        { type: 'text', value: ' bar' }
      ]
    });
  });
});
