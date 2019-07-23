'use strict';

require('mocha');
const assert = require('assert').strict;
const { INSERTION_RE, REGEX_FORMAT_RE } = require('../lib/constants');

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
  describe('INSERTION_RE', () => {
    const match = matcher(INSERTION_RE);

    it('should match insertions', () => {
      assert.deepEqual(match('(?1:foo)'), ['(?1:foo)', '1', 'foo']);
      assert.deepEqual(match('(?1:foo:bar)'), ['(?1:foo:bar)', '1', 'foo', 'bar']);
      assert.deepEqual(match('(?1:foo:bar\\))'), ['(?1:foo:bar\\))', '1', 'foo', 'bar\\)']);
      assert.deepEqual(match('(?1:foo\\)'), null);
      assert.deepEqual(match('(?1:foo\\:bar)'), ['(?1:foo\\:bar)', '1', 'foo\\:bar']);
    });
  });

  describe('REGEX_FORMAT_RE', () => {
    const match = matcher(REGEX_FORMAT_RE);

    it.skip('should match replacers', () => {

    });
  });
});
