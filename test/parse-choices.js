'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../lib/parse');

describe('choices - parse', () => {
  it('should parse placeholder choices', async () => {
    let choices = async str => {
      let ast = await parse(str);
      let node = ast.nodes[0];
      if (node && node.nodes && node.nodes[0]) {
        return node.nodes[0].choices;
      }
    };

    assert.deepEqual(await choices('${TM_FILENAME|one,two,three|}'), void 0);
    assert.deepEqual(await choices('${1|one,two,three|}'), ['one', 'two', 'three']);
    assert.deepEqual(await choices('\\${1|one,two,three|}'), void 0);
    assert.deepEqual(await choices('${1|one,  two,    three|}'), ['one', '  two', '    three']);
    assert.deepEqual(await choices('${1|one\\,  two,    three|}'), ['one\\,  two', '    three']);
    assert.deepEqual(await choices('${1|one\\,  two \\| three|}'), ['one\\,  two \\| three']);
    assert.deepEqual(await choices('${1|\\,,},$,\\|,\\\\|}'), [ '\\,', '}', '$', '\\|', '\\\\' ]);

    assert.deepEqual(await parse('${0|one,two,three|}'), {
      type: 'root',
      nodes: [
        {
          type: 'tabstop',
          number: 0,
          nodes: []
        }
      ]
    });

    assert.deepEqual(await parse('${1|one,two,three|}'), {
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

    assert.deepEqual(await parse('${2|one,two,three|}'), {
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
