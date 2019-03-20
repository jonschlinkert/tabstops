'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../lib/parse');

describe('variable transforms - parse', () => {
  it('should parse and collate variable transform snippets', async () => {
    let transform = async input => {
      let node = await parse.transform(input);
      delete node.transform;
      delete node.value;
      delete node.type;
      return node;
    };

    assert.deepEqual(await transform('TM_FILENAME/(.*)\\..+$/$1/gi'), {
      varname: 'TM_FILENAME',
      regex: /(.*)\..+$/gi,
      format: '$1',
      flags: 'gi',
      nodes: [{ type: 'tabstop', number: 1 }]
    });

    assert.deepEqual(await transform('TM_FILENAME/(.*)\\}.+$/$1/gi'), {
      varname: 'TM_FILENAME',
      regex: /(.*)\}.+$/gi,
      format: '$1',
      flags: 'gi',
      nodes: [{ type: 'tabstop', number: 1 }]
    });

    assert.deepEqual(await transform('TM_FILENAME/(.*)\\/.+$/$1/gi'), {
      varname: 'TM_FILENAME',
      regex: /(.*)\/.+$/gi,
      format: '$1',
      flags: 'gi',
      nodes: [{ type: 'tabstop', number: 1 }]
    });

    assert.deepEqual(await transform('TM_FILENAME/([a-b]{1,4})\\/.+$/$1/gi:ComponentName'), {
      varname: 'TM_FILENAME',
      regex: /([a-b]{1,4})\/.+$/gi,
      format: '$1',
      flags: 'gi',
      placeholder: 'ComponentName',
      nodes: [{ type: 'tabstop', number: 1 }]
    });

    assert.deepEqual(await transform('foobar\\|foobar/(foo)(bar)/$1${_}$2/g'), {
      varname: 'foobar\\|foobar',
      regex: /(foo)(bar)/g,
      format: '$1${_}$2',
      flags: 'g',
      nodes: [
        { type: 'tabstop', number: 1 },
        { type: 'variable', value: '_' },
        { type: 'tabstop', number: 2 }
      ]
    });

    assert.deepEqual(await transform('foobar\\|foobar/(foo)(bar)/${1}_$2/g'), {
      varname: 'foobar\\|foobar',
      regex: /(foo)(bar)/g,
      format: '${1}_$2',
      flags: 'g',
      nodes: [
        { type: 'tabstop', number: 1 },
        { type: 'text', value: '_' },
        { type: 'tabstop', number: 2 }
      ]
    });

    assert.deepEqual(await transform('foobar\\|foobar/(foo)(bar)/${1}_${2}/g'), {
      varname: 'foobar\\|foobar',
      regex: /(foo)(bar)/g,
      format: '${1}_${2}',
      flags: 'g',
      nodes: [
        { type: 'tabstop', number: 1 },
        { type: 'text', value: '_' },
        { type: 'tabstop', number: 2 }
      ]
    });

    assert.deepEqual(await transform('foobar\\|foobar/(foo)(bar)/${1}_${2:TM_FILENAME}/g'), {
      varname: 'foobar\\|foobar',
      regex: /(foo)(bar)/g,
      format: '${1}_${2:TM_FILENAME}',
      flags: 'g',
      nodes: [
        { type: 'tabstop', number: 1 },
        { type: 'text', value: '_' },
        {
          type: 'tabstop',
          number: 2,
          placeholder: 'TM_FILENAME'
        }
      ]
    });

    assert.deepEqual(await transform('foobar\\|foobar/(foo)(bar)/${1}_${2:${TM_FILENAME}}/g'), {
      varname: 'foobar\\|foobar',
      regex: /(foo)(bar)/g,
      format: '${1}_${2:${TM_FILENAME}}',
      flags: 'g',
      nodes: [
        { type: 'tabstop', number: 1 },
        { type: 'text', value: '_' },
        {
          type: 'tabstop',
          number: 2,
          nodes: [
            {
              type: 'variable',
              value: 'TM_FILENAME',
              nodes: []
            }
          ]
        }
      ]
    });
  });
});
