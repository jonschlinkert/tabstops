'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../lib/parse');

describe('placeholders - parse', () => {
  it('should parse a placeholder', async () => {
    let ast = await parse('foo ${1:bar} baz');

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'tabstop', number: 1, placeholder: 'bar', nodes: [] },
        { type: 'text', value: ' baz' }
      ]
    });
  });

  it('should parse multiple placeholders', async () => {
    let ast = await parse('foo ${1:bar} baz ${2:qux} fez');

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        { type: 'tabstop', number: 1, placeholder: 'bar', nodes: [] },
        { type: 'text', value: ' baz ' },
        { type: 'tabstop', number: 2, placeholder: 'qux', nodes: [] },
        { type: 'text', value: ' fez' }
      ]
    });
  });

  it('should parse nested placeholders', async () => {
    let ast = await parse('foo ${1:placeholder${2:another}} bar');

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        {
          type: 'tabstop',
          number: 1,
          nodes: [
            {
              type: 'text',
              value: 'placeholder'
            },
            {
              type: 'tabstop',
              number: 2,
              placeholder: 'another',
              nodes: []
            }
          ]
        },
        { type: 'text', value: ' bar' }
      ]
    });
  });

  it('should parse nested placeholders with newlines', async () => {
    let ast = await parse(`\${2:(
        \${3:<div>\${0}</div>}
      );}`);

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        {
          type: 'tabstop',
          number: 2,
          nodes: [
            {
              type: 'text',
              value: '(\n        '
            },
            {
              type: 'tabstop',
              number: 3,
              nodes: [
                {
                  type: 'text',
                  value: '<div>'
                },
                {
                  type: 'tabstop',
                  number: 0,
                  nodes: []
                },
                {
                  type: 'text',
                  value: '</div>'
                }
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
