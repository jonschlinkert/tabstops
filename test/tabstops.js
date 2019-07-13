'use strict';

require('mocha');
const assert = require('assert').strict;
const TabStops = require('..');

describe('tabstops - parse', () => {
  it.only('should parse a placeholder', async () => {
    let { ast } = new TabStops('foo ${1:bar} baz');

    assert.deepEqual(ast, {
      type: 'root',
      input: 'foo ${1:bar} baz',
      nodes: [
        { type: 'text', line: 1, value: 'foo ' },
        {
          type: 'tabstop',
          open: '${',
          close: '}',
          line: 1,
          number: 1,
          placeholder: 'bar'
        },
        { type: 'text', line: 1, value: ' baz' }
      ]
    });
  });

  it('should parse a placeholder with whitespace', async () => {
    let { ast } = new TabStops(`<div\${1: id="\${2:some_id}"}>
    $0
</div>`);

    assert.deepEqual(ast, {
      type: 'root',
      input: '<div${1: id="${2:some_id}"}>\n    $0\n</div>',
      nodes: [
        { type: 'text', line: 1, value: '<div' },
        {
          type: 'tabstop',
          open: '${',
          close: '}',
          line: 1,
          number: 1,
          nodes: [
            { type: 'text', line: 1, value: ' id="' },
            { type: 'tabstop', line: 1, number: 2, open: '${', close: '}', placeholder: 'some_id' },
            { type: 'text', line: 1, value: '"' }
          ]
        },
        { type: 'text', line: 1, value: '>\n    ' },
        { type: 'tabstop', line: 2, number: 0, open: '$', close: '' },
        { type: 'text', line: 3, value: '\n</div>' }
      ]
    });
  });

  it('should parse multiple placeholders', async () => {
    let { ast } = new TabStops('foo ${1:bar} baz ${2:qux} fez');

    assert.deepEqual(ast, {
      type: 'root',
      input: 'foo ${1:bar} baz ${2:qux} fez',
      nodes: [
        { type: 'text', line: 1, value: 'foo ' },
        {
          type: 'tabstop',
          open: '${',
          close: '}',
          line: 1,
          number: 1,
          placeholder: 'bar'
        },
        { type: 'text', line: 1, value: ' baz ' },
        {
          type: 'tabstop',
          open: '${',
          close: '}',
          line: 1,
          number: 2,
          placeholder: 'qux'
        },
        { type: 'text', line: 1, value: ' fez' }
      ]
    });
  });

  it('should parse nested placeholders', async () => {
    let { ast } = new TabStops('foo ${1:placeholder${2:another}} bar');

    assert.deepEqual(ast, {
      type: 'root',
      input: 'foo ${1:placeholder${2:another}} bar',
      nodes: [
        { type: 'text', line: 1, value: 'foo ' },
        {
          type: 'tabstop',
          open: '${',
          close: '}',
          number: 1,
          line: 1,
          nodes: [
            {
              type: 'text',
              line: 1,
              value: 'placeholder'
            },
            {
              type: 'tabstop',
              open: '${',
              close: '}',
              line: 1,
              number: 2,
              placeholder: 'another'
            }
          ]
        },
        { type: 'text', line: 1, value: ' bar' }
      ]
    });
  });

  it('should parse nested placeholders with newlines', async () => {
    let { ast } = new TabStops('\${2:(\n        \${3:<div>\${0}</div>}\n      );}');

    assert.deepEqual(ast, {
      type: 'root',
      input: '\${2:(\n        \${3:<div>\${0}</div>}\n      );}',
      nodes: [
        {
          type: 'tabstop',
          open: '${',
          close: '}',
          line: 1,
          number: 2,
          nodes: [
            { type: 'text', line: 1, value: '(\n        ' },
            {
              type: 'tabstop',
              open: '${',
              close: '}',
              number: 3,
              line: 2,
              nodes: [
                { type: 'text', line: 2, value: '<div>' },
                {
                  type: 'tabstop',
                  open: '${',
                  close: '}',
                  line: 2,
                  number: 0
                },
                { type: 'text', line: 2, value: '</div>' }
              ]
            },
            { type: 'text', line: 3, value: '\n      );' }
          ]
        }
      ]
    });
  });
});
