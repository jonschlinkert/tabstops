'use strict';

require('mocha');
const assert = require('assert').strict;
const parse = require('../lib/parse');
const format = require('./support/format');

describe('variables - parse', () => {
  it('should parse a variable', () => {
    assert.deepEqual(parse('foo $TM_FILEPATH bar'), {
      type: 'root',
      input: 'foo $TM_FILEPATH bar',
      nodes: [
        { type: 'text', line: 1, value: 'foo ' },
        { type: 'variable', open: '$', close: '', line: 1, value: 'TM_FILEPATH' },
        { type: 'text', line: 1, value: ' bar' }
      ]
    });

    assert.deepEqual(parse('foo $TM_USERNAME bar'), {
      type: 'root',
      input: 'foo $TM_USERNAME bar',
      nodes: [
        { type: 'text', line: 1, value: 'foo ' },
        { type: 'variable', open: '$', close: '', line: 1, value: 'TM_USERNAME' },
        { type: 'text', line: 1, value: ' bar' }
      ]
    });
  });

  it('should parse a textmate variable', () => {
    assert.deepEqual(parse('textbf{${TM_SELECTED_TEXT:no text was selected}}'), {
      type: 'root',
      input: 'textbf{${TM_SELECTED_TEXT:no text was selected}}',
      nodes: [
        { type: 'text', line: 1, value: 'textbf{' },
        { type: 'variable', open: '${', close: '}', line: 1, sep: ':', value: 'TM_SELECTED_TEXT', placeholder: 'no text was selected' },
        { type: 'text', line: 1, value: '}' }
      ]
    });
  });

  it('should parse an alphanumeric tabstop variable', () => {
    let ast = parse('foo $FOO123BAR bar');

    assert.deepEqual(ast, {
      type: 'root',
      input: 'foo $FOO123BAR bar',
      nodes: [
        { type: 'text', line: 1, value: 'foo ' },
        { type: 'variable', open: '$', close: '', line: 1, value: 'FOO123BAR' },
        { type: 'text', line: 1, value: ' bar' }
      ]
    });
  });

  it('should parse an alphanumeric tabstop variable', () => {
    let ast = parse('foo $FOO123BAR bar');

    assert.deepEqual(ast, {
      type: 'root',
      input: 'foo $FOO123BAR bar',
      nodes: [
        { type: 'text', line: 1, value: 'foo ' },
        { type: 'variable', open: '$', close: '', line: 1, value: 'FOO123BAR' },
        { type: 'text', line: 1, value: ' bar' }
      ]
    });
  });

  it('should correctly deal non-terminator right brace', () => {
    let ast = parse('foo $FOO123BAR} bar');

    assert.deepEqual(ast, {
      type: 'root',
      input: 'foo $FOO123BAR} bar',
      nodes: [
        { type: 'text', line: 1, value: 'foo ' },
        { type: 'variable', open: '$', close: '', line: 1, value: 'FOO123BAR' },
        { type: 'text', line: 1, value: '} bar' }
      ]
    });
  });

  it('should correctly deal with escaped right brace', () => {
    let ast = parse('foo $FOO123BAR\\} bar');

    assert.deepEqual(ast, {
      type: 'root',
      input: 'foo $FOO123BAR\\} bar',
      nodes: [
        { type: 'text', line: 1, value: 'foo ' },
        { type: 'variable', open: '$', close: '', line: 1, value: 'FOO123BAR' },
        { type: 'text', line: 1, value: '\\} bar' }
      ]
    });
  });

  it('should add line numbers when enabled', () => {
    let ast = parse('foo $FOO123BAR\\}\nbar\n$BAZ');

    assert.deepEqual(ast, {
      type: 'root',
      input: 'foo $FOO123BAR\\}\nbar\n$BAZ',
      nodes: [
        { type: 'text', line: 1, value: 'foo ' },
        { type: 'variable', open: '$', close: '', line: 1, value: 'FOO123BAR' },
        { type: 'text', line: 1, value: '\\}\nbar\n' },
        { type: 'variable', open: '$', close: '', line: 3, value: 'BAZ' }
      ]
    });
  });
});
