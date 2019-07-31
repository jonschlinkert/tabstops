'use strict';

require('mocha');
const assert = require('assert').strict;
const { INSERTION_REGEX, TRANSFORM_FORMAT_REGEX } = require('../lib/constants');

const matcher = regex => {
  return input => {
    let m = regex.exec(input);
    if (m) {
      let arr = m.slice();
      while (arr[arr.length - 1] === void 0) arr.pop();
      return arr;
    }
    return null;
  };
};

describe('constants - regular expressions', () => {
  describe('TRANSFORM_FORMAT_REGEX', () => {
    const match = matcher(TRANSFORM_FORMAT_REGEX);

    it('should match replacers', () => {
      assert.deepEqual(match('$2-'), ['$2', '2']);
      assert.deepEqual(match('${2}'), ['${2}', undefined, '${', '2', undefined, '']);
      assert.deepEqual(match('${1/upcase}'), ['${1/upcase}', undefined, '${', '1', '/', 'upcase']);
      assert.deepEqual(match('${1:?It is:It is not}'), ['${1:?It is:It is not}', undefined, '${', '1', ':?', 'It is:It is not']);
    });
  });
});
