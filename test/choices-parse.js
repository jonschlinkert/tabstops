'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../lib/parse');

describe('choices - parse', () => {
  it('should parse placeholder choices', () => {
    let choices = str => parse(str).nodes[0].choices;

    // console.log(choices('${TM_FILENAME|one,two,three|}'))
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
});
