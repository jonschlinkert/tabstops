'use strict';

require('mocha');
const assert = require('assert').strict;
const parse = require('../lib/parse');

describe('variable transforms - parse', () => {
  it('should parse and collate variable transform snippets', async () => {
    let transform = async input => {
      let node = await parse.transform(input);
      delete node.transform;
      return node;
    };

    assert.deepEqual(await transform('TM_FILENAME/(.*)\\..+$/$1/gi'), {
      type: 'transform',
      value: 'TM_FILENAME/(.*)\\..+$/$1/gi',
      varname: 'TM_FILENAME',
      regex: /(.*)\..+$/gi,
      format: '$1',
      flags: 'gi',
      nodes: [{ type: 'tabstop', open: '$', close: '', line: 1, number: 1 }]
    });

    assert.deepEqual(await transform('TM_FILENAME/(.*)\\}.+$/$1/gi'), {
      type: 'transform',
      value: 'TM_FILENAME/(.*)\\}.+$/$1/gi',
      varname: 'TM_FILENAME',
      regex: /(.*)\}.+$/gi,
      format: '$1',
      flags: 'gi',
      nodes: [{ type: 'tabstop', open: '$', close: '', line: 1, number: 1 }]
    });

    assert.deepEqual(await transform('TM_FILENAME/(.*)\\/.+$/$1/gi'), {
      type: 'transform',
      value: 'TM_FILENAME/(.*)\\/.+$/$1/gi',
      varname: 'TM_FILENAME',
      regex: /(.*)\/.+$/gi,
      format: '$1',
      flags: 'gi',
      nodes: [{ type: 'tabstop', open: '$', close: '', line: 1, number: 1 }]
    });

    assert.deepEqual(await transform('TM_FILENAME/([a-b]{1,4})\\/.+$/$1/gi:ComponentName'), {
      type: 'transform',
      value: 'TM_FILENAME/([a-b]{1,4})\\/.+$/$1/gi:ComponentName',
      varname: 'TM_FILENAME',
      regex: /([a-b]{1,4})\/.+$/gi,
      format: '$1',
      flags: 'gi',
      placeholder: 'ComponentName',
      nodes: [{ type: 'tabstop', open: '$', close: '', line: 1, number: 1 }]
    });

    assert.deepEqual(await transform('foobar\\|foobar/(foo)(bar)/$1${_}$2/g'), {
      type: 'transform',
      value: 'foobar\\|foobar/(foo)(bar)/$1${_}$2/g',
      varname: 'foobar\\|foobar',
      regex: /(foo)(bar)/g,
      format: '$1${_}$2',
      flags: 'g',
      nodes: [
        { type: 'tabstop', open: '$', close: '', line: 1, number: 1 },
        { type: 'variable', open: '${', close: '}', line: 1, value: '_' },
        { type: 'tabstop', open: '$', close: '', line: 1, number: 2 }
      ]
    });

    assert.deepEqual(await transform('foobar\\|foobar/(foo)(bar)/${1}_$2/g'), {
      type: 'transform',
      value: 'foobar\\|foobar/(foo)(bar)/${1}_$2/g',
      varname: 'foobar\\|foobar',
      regex: /(foo)(bar)/g,
      format: '${1}_$2',
      flags: 'g',
      nodes: [
        { type: 'tabstop', open: '${', close: '}', line: 1, number: 1 },
        { type: 'text', line: 1, value: '_' },
        { type: 'tabstop', open: '$', close: '', line: 1, number: 2 }
      ]
    });

    assert.deepEqual(await transform('foobar\\|foobar/(foo)(bar)/${1}_${2}/g'), {
      type: 'transform',
      value: 'foobar\\|foobar/(foo)(bar)/${1}_${2}/g',
      varname: 'foobar\\|foobar',
      regex: /(foo)(bar)/g,
      format: '${1}_${2}',
      flags: 'g',
      nodes: [
        { type: 'tabstop', open: '${', close: '}', line: 1, number: 1 },
        { type: 'text', line: 1, value: '_' },
        { type: 'tabstop', open: '${', close: '}', line: 1, number: 2 }
      ]
    });

    assert.deepEqual(await transform('foobar\\|foobar/(foo)(bar)/${1}_${2:TM_FILENAME}/g'), {
      type: 'transform',
      value: 'foobar\\|foobar/(foo)(bar)/${1}_${2:TM_FILENAME}/g',
      varname: 'foobar\\|foobar',
      regex: /(foo)(bar)/g,
      format: '${1}_${2:TM_FILENAME}',
      flags: 'g',
      nodes: [
        { type: 'tabstop', open: '${', close: '}', line: 1, number: 1 },
        { type: 'text', line: 1, value: '_' },
        {
          type: 'tabstop',
          open: '${',
          close: '}',
          number: 2,
          line: 1,
          placeholder: 'TM_FILENAME'
        }
      ]
    });

    assert.deepEqual(await transform('foobar\\|foobar/(foo)(bar)/${1}_${2:${TM_FILENAME}}/g'), {
      type: 'transform',
      value: 'foobar\\|foobar/(foo)(bar)/${1}_${2:${TM_FILENAME}}/g',
      varname: 'foobar\\|foobar',
      regex: /(foo)(bar)/g,
      format: '${1}_${2:${TM_FILENAME}}',
      flags: 'g',
      nodes: [
        { type: 'tabstop', open: '${', close: '}', line: 1, number: 1 },
        { type: 'text', line: 1, value: '_' },
        {
          type: 'tabstop',
          open: '${',
          close: '}',
          number: 2,
          line: 1,
          nodes: [
            {
              type: 'variable',
              open: '${',
              close: '}',
              value: 'TM_FILENAME',
              line: 1
            }
          ]
        }
      ]
    });
  });
});
