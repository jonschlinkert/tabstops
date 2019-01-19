'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../parse');
const format = require('./support/format');

describe('tabstops - parse({ collate: true })', () => {
  it('should parse a numerical tabstop', () => {
    let ast = parse('foo $1 bar');

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
              value: '$'
            }
          ]
        },
        { type: 'text', value: ' bar' }
      ]
    });
  });

  it('should parse a variable', () => {
    let ast = parse('foo $TM_FILEPATH bar');

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        {
          type: 'tabstop',
          stop: null,
          placeholder: '',
          nodes: [
            {
              type: 'open',
              value: '$'
            },
            {
              type: 'text',
              value: 'TM_FILEPATH'
            }
          ]
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
          placeholder: '',
          nodes: [
            {
              type: 'open',
              value: '$'
            },
            {
              type: 'text',
              value: 'FOO123BAR'
            }
          ]
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

  it('should parse a placeholder from a tabstop template literal', () => {
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

  it('should parse multiple tabstops with placeholders', () => {
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

  it('should parse nested tabstops with placeholders', () => {
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

  it('should parse nested tabstops with newlines', () => {
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

  it('should parse a snippet with placeholder choices', () => {
    let choices = str => parse(str).nodes[0].choices;

    choices('${1|\\,,},$,\\|,\\\\|}');

    assert.deepEqual(choices('${TM_FILENAME|one,two,three|}'), ['one', 'two', 'three']);
    assert.deepEqual(choices('${1|one,two,three|}'), ['one', 'two', 'three']);
    assert.deepEqual(choices('\\${1|one,two,three|}'), void 0);
    assert.deepEqual(choices('${1|one,  two,    three|}'), ['one', '  two', '    three']);
    assert.deepEqual(choices('${1|one\\,  two,    three|}'), ['one\\,  two', '    three']);
    assert.deepEqual(choices('${1|one\\,  two \\| three|}'), ['one\\,  two \\| three']);
    assert.deepEqual(choices('${1|\\,,},$,\\|,\\\\|}'), [ '\\,', '}', '$', '\\|', '\\\\' ]);

    assert.deepEqual(parse('${1|one,two,three|}'), {
      type: 'root',
      nodes: [
        {
          type: 'tabstop',
          stop: 1,
          placeholder: '',
          varname: '',
          default: '',
          nodes: [],
          choices: ['one', 'two', 'three']
        }
      ]
    });

    assert.deepEqual(parse('${TM_FILENAME|one,two,three|}'), {
      type: 'root',
      nodes: [
        {
          type: 'tabstop',
          stop: null,
          varname: 'TM_FILENAME',
          default: '',
          placeholder: '',
          nodes: [],
          choices: ['one', 'two', 'three']
        }
      ]
    });
  });

  it('should parse variable transform snippets', () => {
    let transforms = str => parse(str).nodes[1].nodes.slice(1, -1);

    assert.deepEqual(transforms('Foo ${TM_FILENAME/(.+)\\..+|.*/$1/:ComponentName} Bar'), [
      { type: 'varname', value: 'TM_FILENAME' },
      { type: 'regex', value: '(.+)\\..+|.*' },
      { type: 'format_string', value: '$1' },
      { type: 'flags', value: '' },
      { type: 'placeholder', value: 'ComponentName' }
    ]);

    assert.deepEqual(transforms('Foo ${TM_FILENAME/(.*)\\..+$/$1/gi} Bar'), [
      { type: 'varname', value: 'TM_FILENAME' },
      { type: 'regex', value: '(.*)\\..+$' },
      { type: 'format_string', value: '$1' },
      { type: 'flags', value: 'gi' }
    ]);

    assert.deepEqual(transforms('Foo ${TM_FILENAME/(.*)\\}.+$/$1/gi} Bar'), [
      { type: 'varname', value: 'TM_FILENAME' },
      { type: 'regex', value: '(.*)\\}.+$' },
      { type: 'format_string', value: '$1' },
      { type: 'flags', value: 'gi' }
    ]);

    assert.deepEqual(transforms('Foo ${TM_FILENAME/(.*)\\/.+$/$1/gi} Bar'), [
      { type: 'varname', value: 'TM_FILENAME' },
      { type: 'regex', value: '(.*)\\/.+$' },
      { type: 'format_string', value: '$1' },
      { type: 'flags', value: 'gi' }
    ]);

    assert.deepEqual(transforms('Foo ${TM_FILENAME/([a-b]{1,4})\\/.+$/$1/gi} Bar'), [
      { type: 'varname', value: 'TM_FILENAME' },
      { type: 'regex', value: '([a-b]{1,4})\\/.+$' },
      { type: 'format_string', value: '$1' },
      { type: 'flags', value: 'gi' }
    ]);
  });

  it('should parse placeholder transform snippets', () => {
    let transforms = str => parse(str).nodes[1].nodes.slice(1, -1);

    assert.deepEqual(transforms('Foo ${1/./=/g} Bar'), [
      { type: 'varname', value: '1' },
      { type: 'regex', value: '.' },
      { type: 'format_string', value: '=' },
      { type: 'flags', value: 'g' }
    ]);
  });
});
