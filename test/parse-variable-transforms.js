'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../lib/parse');

describe('variable transforms - parse', () => {
  it('should parse and collate variable transform snippets', () => {
    let transform = input => {
      let node = parse.transform(input);
      delete node.transform;
      delete node.value;
      delete node.type;
      return node;
    };

    assert.deepEqual(transform('TM_FILENAME/(.*)\\..+$/$1/gi'), {
      varname: 'TM_FILENAME',
      regex: /(.*)\..+$/gi,
      format: '$1',
      flags: 'gi',
      groups: [{ type: 'match', group: 1 }]
    });

    assert.deepEqual(transform('TM_FILENAME/(.*)\\}.+$/$1/gi'), {
      varname: 'TM_FILENAME',
      regex: /(.*)\}.+$/gi,
      format: '$1',
      flags: 'gi',
      groups: [{ type: 'match', group: 1 }]
    });

    assert.deepEqual(transform('TM_FILENAME/(.*)\\/.+$/$1/gi'), {
      varname: 'TM_FILENAME',
      regex: /(.*)\/.+$/gi,
      format: '$1',
      flags: 'gi',
      groups: [{ type: 'match', group: 1 }]
    });

    assert.deepEqual(transform('TM_FILENAME/([a-b]{1,4})\\/.+$/$1/gi:ComponentName'), {
      varname: 'TM_FILENAME',
      regex: /([a-b]{1,4})\/.+$/gi,
      format: '$1',
      flags: 'gi',
      placeholder: 'ComponentName',
      groups: [{ type: 'match', group: 1 }]
    });

    assert.deepEqual(transform('foobar\\|foobar/(foo)(bar)/$1${_}$2/g'), {
      varname: 'foobar\\|foobar',
      regex: /(foo)(bar)/g,
      format: '$1${_}$2',
      flags: 'g',
      groups: [
        { type: 'match', group: 1 },
        { type: 'variable', value: '_' },
        { type: 'match', group: 2 }
      ]
    });

    assert.deepEqual(transform('foobar\\|foobar/(foo)(bar)/${1}_$2/g'), {
      varname: 'foobar\\|foobar',
      regex: /(foo)(bar)/g,
      format: '${1}_$2',
      flags: 'g',
      groups: [
        { type: 'match', group: 1 },
        { type: 'text', value: '_' },
        { type: 'match', group: 2 }
      ]
    });

    assert.deepEqual(transform('foobar\\|foobar/(foo)(bar)/${1}_${2}/g'), {
      varname: 'foobar\\|foobar',
      regex: /(foo)(bar)/g,
      format: '${1}_${2}',
      flags: 'g',
      groups: [
        { type: 'match', group: 1 },
        { type: 'text', value: '_' },
        { type: 'match', group: 2 }
      ]
    });

    assert.deepEqual(transform('foobar\\|foobar/(foo)(bar)/${1}_${2:TM_FILENAME}/g'), {
      varname: 'foobar\\|foobar',
      regex: /(foo)(bar)/g,
      format: '${1}_${2:TM_FILENAME}',
      flags: 'g',
      groups: [
        { type: 'match', group: 1 },
        { type: 'text', value: '_' },
        {
          type: 'match',
          group: 2,
          placeholder: 'TM_FILENAME'
        }
      ]
    });

    assert.deepEqual(transform('foobar\\|foobar/(foo)(bar)/${1}_${2:${TM_FILENAME}}/g'), {
      varname: 'foobar\\|foobar',
      regex: /(foo)(bar)/g,
      format: '${1}_${2:${TM_FILENAME}}',
      flags: 'g',
      groups: [
        { type: 'match', group: 1 },
        { type: 'text', value: '_' },
        {
          type: 'match',
          group: 2,
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
