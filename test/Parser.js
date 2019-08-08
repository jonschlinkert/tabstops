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

  describe('.handler', () => {
    it.skip('should register a custom handler', () => {
      const parser = new Parser('foo');

      parser.after('text', { name: 'foo', regex: /bar/, fn: () => {} });
      parser.before('static', { name: 'blah', regex: /bar/, fn: () => {} });
      parser.handler({ name: 'abc', regex: /bar/, fn: () => {} });
      console.log(parser.handlers);
    });
  });

  describe('.before', () => {

  });

  describe('.after', () => {

  });
});
