'use strict';

require('mocha');
const assert = require('assert').strict;
const Parser = require('../lib/Parser');

describe('Parser class', () => {
  describe('.match', () => {
    it('should throw when value is not a regex', () => {
      let parser = new Parser('foo');
      assert.throws(() => parser.match('foo'));
    });
  });
});
