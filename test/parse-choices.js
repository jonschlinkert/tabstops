'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../lib/parse');

describe('choices - parse', () => {
  it('should parse placeholder choices', () => {
    let choices = str => {
      let ast = parse(str);
      let node = ast.nodes[0];
      if (node && node.nodes && node.nodes[0]) {
        return node.nodes[0].choices;
      }
    };

    assert.deepEqual(choices('${TM_FILENAME|one,two,three|}'), void 0);
    assert.deepEqual(choices('${1|one,two,three|}'), ['one', 'two', 'three']);
    assert.deepEqual(choices('\\${1|one,two,three|}'), void 0);
    assert.deepEqual(choices('${1|one,  two,    three|}'), ['one', '  two', '    three']);
    assert.deepEqual(choices('${1|one\\,  two,    three|}'), ['one\\,  two', '    three']);
    assert.deepEqual(choices('${1|one\\,  two \\| three|}'), ['one\\,  two \\| three']);
    assert.deepEqual(choices('${1|\\,,},$,\\|,\\\\|}'), [ '\\,', '}', '$', '\\|', '\\\\' ]);

    assert.deepEqual(parse('${0|one,two,three|}'), {
      type: 'root',
      nodes: [
        {
          type: 'tabstop',
          number: 0,
          nodes: []
        }
      ]
    });

    assert.deepEqual(parse('${1|one,two,three|}'), {
      type: 'root',
      nodes: [
        {
          type: 'tabstop',
          number: 1,
          nodes: [
            {
              type: 'choices',
              value: '|one,two,three|',
              choices: ['one', 'two', 'three']
            }
          ]
        }
      ]
    });

    assert.deepEqual(parse('${2|one,two,three|}'), {
      type: 'root',
      nodes: [
        {
          type: 'tabstop',
          number: 2,
          nodes: [
            {
              type: 'choices',
              value: '|one,two,three|',
              choices: ['one', 'two', 'three']
            }
          ]
        }
      ]
    });
  });
});
