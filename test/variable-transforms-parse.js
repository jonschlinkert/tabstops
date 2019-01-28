'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../lib/parse');
const format = require('./support/format');

describe('variable transforms - parse', () => {
  it('should parse variable transform snippets', () => {
    let transforms = str => parse(str).nodes[1].nodes.slice(1, -1);

    assert.deepEqual(transforms('Foo ${TM_FILENAME/(.+)\\..+|.*/$1/:ComponentName} Bar'), [
      { type: 'varname', value: 'TM_FILENAME' },
      { type: 'regex', value: '(.+)\\..+|.*' },
      { type: 'format', value: '$1' },
      { type: 'flags', value: '' },
      { type: 'placeholder', value: 'ComponentName' }
    ]);

    assert.deepEqual(transforms('Foo ${TM_FILENAME/(.*)\\..+$/$1/gi} Bar'), [
      { type: 'varname', value: 'TM_FILENAME' },
      { type: 'regex', value: '(.*)\\..+$' },
      { type: 'format', value: '$1' },
      { type: 'flags', value: 'gi' }
    ]);

    assert.deepEqual(transforms('Foo ${TM_FILENAME/(.*)\\}.+$/$1/gi} Bar'), [
      { type: 'varname', value: 'TM_FILENAME' },
      { type: 'regex', value: '(.*)\\}.+$' },
      { type: 'format', value: '$1' },
      { type: 'flags', value: 'gi' }
    ]);

    assert.deepEqual(transforms('Foo ${TM_FILENAME/(.*)\\/.+$/$1/gi} Bar'), [
      { type: 'varname', value: 'TM_FILENAME' },
      { type: 'regex', value: '(.*)\\/.+$' },
      { type: 'format', value: '$1' },
      { type: 'flags', value: 'gi' }
    ]);

    assert.deepEqual(transforms('Foo ${TM_FILENAME/([a-b]{1,4})\\/.+$/$1/gi} Bar'), [
      { type: 'varname', value: 'TM_FILENAME' },
      { type: 'regex', value: '([a-b]{1,4})\\/.+$' },
      { type: 'format', value: '$1' },
      { type: 'flags', value: 'gi' }
    ]);
  });

  it('should parse and collate variable transform snippets', () => {
    let transforms = str => {
      let node = parse(str, { collate: true });
      let first = node.nodes.find(n => n.type === 'transform_variable');
      let pick = ['varname', 'regex', 'format', 'flags', 'default'];
      let obj = {};

      for (let key of Object.keys(first)) {
        if (pick.includes(key)) {
          obj[key] = first[key];
        }
      }
      return obj;
    };

    assert.deepEqual(transforms('Foo ${TM_FILENAME/(.*)\\..+$/$1/gi} Bar'), {
      varname: 'TM_FILENAME',
      regex: /(.*)\..+$/gi,
      format: '$1',
      flags: 'gi'
    });

    assert.deepEqual(transforms('Foo ${TM_FILENAME/(.*)\\}.+$/$1/gi} Bar'), {
      varname: 'TM_FILENAME',
      regex: /(.*)\}.+$/gi,
      format: '$1',
      flags: 'gi'
    });

    assert.deepEqual(transforms('Foo ${TM_FILENAME/(.*)\\/.+$/$1/gi} Bar'), {
      varname: 'TM_FILENAME',
      regex: /(.*)\/.+$/gi,
      format: '$1',
      flags: 'gi'
    });

    assert.deepEqual(transforms('Foo ${TM_FILENAME/([a-b]{1,4})\\/.+$/$1/gi} Bar'), {
      varname: 'TM_FILENAME',
      regex: /([a-b]{1,4})\/.+$/gi,
      format: '$1',
      flags: 'gi'
    });

    assert.deepEqual(transforms('${foobar\\|foobar/(foo)(bar)/$1_$2/g}'), {
      varname: 'foobar\\|foobar',
      regex: /(foo)(bar)/g,
      format: '$1_$2',
      flags: 'g'
    });
  });
});
