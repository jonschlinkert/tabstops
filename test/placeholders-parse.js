'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../lib/parse');
const format = require('./support/format');

describe('placeholders - parse', () => {
  it('should parse a placeholder', () => {
    let ast = parse('foo ${1:bar} baz');

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'tabstop', stop: 1, placeholder: 'bar', nodes: [] },
        { type: 'text', value: ' baz' }
      ]
    });
  });

  it('should parse and collate a placeholder', () => {
    let ast = parse('foo ${1:bar} baz', { collate: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'tabstop', stop: 1, placeholder: 'bar', nodes: [] },
        { type: 'text', value: ' baz' }
      ]
    });
  });

  it('should parse multiple placeholders', () => {
    let ast = parse('foo ${1:bar} baz ${2:qux} fez');

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'tabstop', stop: 1, placeholder: 'bar', nodes: [] },
        { type: 'text', value: ' baz ' },
        { type: 'tabstop', stop: 2, placeholder: 'qux', nodes: [] },
        { type: 'text', value: ' fez' }
      ]
    });
  });

  it('should parse and collate multiple placeholders', () => {
    let ast = parse('foo ${1:bar} baz ${2:qux} fez', { collate: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'tabstop', stop: 1, placeholder: 'bar', nodes: [] },
        { type: 'text', value: ' baz ' },
        { type: 'tabstop', stop: 2, placeholder: 'qux', nodes: [] },
        { type: 'text', value: ' fez' }
      ]
    });
  });

  it('should parse nested placeholders', () => {
    let ast = parse('foo ${1:placeholder${2:another}} bar');

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
            {
              type: 'text',
              value: 'placeholder'
            },
            { type: 'tabstop', stop: 2, placeholder: 'another', nodes: [] },
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

  it('should parse and collate nested placeholders', () => {
    let ast = parse('foo ${1:placeholder${2:another}} bar', { collate: true });

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
            {
              type: 'text',
              value: 'placeholder'
            },
            { type: 'tabstop', stop: 2, placeholder: 'another', nodes: [] }
          ]
        },
        { type: 'text', value: ' bar' }
      ]
    });
  });

  it('should parse nested placeholders with newlines', () => {
    let ast = parse(`\${2:(
        \${3:<div>\${0}</div>}
      );}`);

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        {
          type: 'tabstop',
          stop: 2,
          placeholder: '',
          nodes: [
            {
              type: 'open',
              value: '${'
            },
            {
              type: 'text',
              value: '(\n        '
            },
            {
              type: 'tabstop',
              stop: 3,
              placeholder: '',
              nodes: [
                {
                  type: 'open',
                  value: '${'
                },
                {
                  type: 'text',
                  value: '<div>'
                },
                {
                  type: 'tabstop',
                  stop: 0,
                  placeholder: '',
                  nodes: []
                },
                {
                  type: 'text',
                  value: '</div>'
                },
                {
                  type: 'close',
                  value: '}'
                }
              ]
            },
            {
              type: 'text',
              value: '\n      );'
            },
            {
              type: 'close',
              value: '}'
            }
          ]
        }
      ]
    });
  });

  it('should parse and collate nested placeholders with newlines', () => {
    let ast = parse(`\${2:(
        \${3:<div>\${0}</div>}
      );}`, { collate: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        {
          type: 'tabstop',
          stop: 2,
          placeholder: '',
          open: '${',
          close: '}',
          nodes: [
            {
              type: 'text',
              value: '(\n        '
            },
            {
              type: 'tabstop',
              stop: 3,
              placeholder: '',
              open: '${',
              close: '}',
              nodes: [
                {
                  type: 'text',
                  value: '<div>'
                },
                {
                  type: 'tabstop',
                  stop: 0,
                  placeholder: '',
                  nodes: []
                },
                {
                  type: 'text',
                  value: '</div>'
                },
              ]
            },
            {
              type: 'text',
              value: '\n      );'
            }
          ]
        }
      ]
    });
  });
});
