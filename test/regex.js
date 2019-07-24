'use strict';

require('mocha');
const assert = require('assert').strict;
const { INSERTION_REGEX, FORMAT_STRING_REGEX } = require('../lib/constants');

const matcher = regex => {
  return input => {
    let m = regex.exec(input);
    if (m) {
      let arr = m.slice();
      if (arr[arr.length - 1] === void 0) {
        arr.pop();
      }
      return arr;
    }
    return null;
  };
};

describe('constants - regular expressions', () => {
  describe('INSERTION_REGEX', () => {
    const match = matcher(INSERTION_REGEX);

    it('should match insertions', () => {
      assert.deepEqual(match('(?1:foo)'), ['(?1:foo)', '1', 'foo']);
      assert.deepEqual(match('(?1:foo:bar)'), ['(?1:foo:bar)', '1', 'foo', 'bar']);
      assert.deepEqual(match('(?1:foo:bar\\))'), ['(?1:foo:bar\\))', '1', 'foo', 'bar\\)']);
      assert.deepEqual(match('(?1:foo\\)'), null);
      assert.deepEqual(match('(?1:foo\\:bar)'), ['(?1:foo\\:bar)', '1', 'foo\\:bar']);
    });
  });

  describe('FORMAT_STRING_REGEX', () => {
    const match = matcher(FORMAT_STRING_REGEX);

    it('should match replacers', () => {
      assert.deepEqual(match('$2-'), ['$2', '2', undefined, undefined]);
      assert.deepEqual(match('${2}'), ['${2}', undefined, '2', undefined, '']);
      assert.deepEqual(match('${1/upcase}'), ['${1/upcase}', undefined, '1', '/', 'upcase']);
      assert.deepEqual(match('${1:?It is:It is not}'), ['${1:?It is:It is not}', undefined, '1', ':?', 'It is:It is not']);
    });
  });
});
