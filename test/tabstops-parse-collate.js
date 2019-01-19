'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../parse');

describe('tabstops - parse', () => {
  it('should parse a numerical tabstop', () => {
    let ast = parse('foo $1 bar', { collate: true });

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
        { type: 'text', value: ' bar' }
      ]
    });
  });

  it('should parse a tabstop variable', () => {
    let ast = parse('foo $TM_FILEPATH bar', { collate: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        {
          type: 'tabstop',
          stop: null,
          placeholder: '',
          open: '$',
          nodes: [
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
    let ast = parse('foo $FOO123BAR bar', { collate: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        { type: 'text', value: 'foo ' },
        {
          type: 'tabstop',
          stop: null,
          placeholder: '',
          open: '$',
          nodes: [
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

  it('should parse a placeholder from a tabstop template literal', () => {
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

  it('should parse multiple tabstops with placeholders', () => {
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

  it('should parse nested tabstops', () => {
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

  it('should parse nested tabstops with placeholders', () => {
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

  it('should parse nested tabstops with newlines', () => {
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

  it('should parse a snippet with placeholder choices', () => {
    let ast = parse('${1|one,two,three|}', { collate: true });

    assert.deepEqual(ast, {
      type: 'root',
      nodes: [
        {
          type: 'tabstop',
          stop: 1,
          placeholder: '',
          default: '',
          varname: '',
          nodes: [],
          choices: ['one', 'two', 'three']
        }
      ]
    });
  });

  it('should parse variable transform snippets', () => {
    let transforms = str => {
      let node = parse(str, { collate: true }).nodes[1];
      let pick = ['varname', 'regex', 'format_string', 'flags', 'default'];
      let obj = {};
      for (let key of Object.keys(node)) {
        if (pick.includes(key)) {
          obj[key] = node[key];
        }
      }
      return obj;
    };

    assert.deepEqual(transforms('Foo ${TM_FILENAME/(.*)\\..+$/$1/gi} Bar'), {
      varname: 'TM_FILENAME',
      regex: /(.*)\..+$/gi,
      format_string: '$1',
      flags: 'gi'
    });

    assert.deepEqual(transforms('Foo ${TM_FILENAME/(.*)\\}.+$/$1/gi} Bar'), {
      varname: 'TM_FILENAME',
      regex: /(.*)\}.+$/gi,
      format_string: '$1',
      flags: 'gi'
    });

    assert.deepEqual(transforms('Foo ${TM_FILENAME/(.*)\\/.+$/$1/gi} Bar'), {
      varname: 'TM_FILENAME',
      regex: /(.*)\/.+$/gi,
      format_string: '$1',
      flags: 'gi'
    });

    assert.deepEqual(transforms('Foo ${TM_FILENAME/([a-b]{1,4})\\/.+$/$1/gi} Bar'), {
      varname: 'TM_FILENAME',
      regex: /([a-b]{1,4})\/.+$/gi,
      format_string: '$1',
      flags: 'gi'
    });
  });

  it('should parse placeholder transform snippets', () => {
    let transforms = str => {
      let node = parse(str, { collate: true }).nodes[1];
      let pick = ['varname', 'regex', 'format_string', 'flags', 'default'];
      let obj = {};
      for (let key of Object.keys(node)) {
        if (pick.includes(key)) {
          obj[key] = node[key];
        }
      }
      return obj;
    };

    assert.deepEqual(transforms('Foo ${1/./=/g} Bar'), {
      varname: '1',
      regex: /./g,
      format_string: '=',
      flags: 'g'
    });
  });
});
