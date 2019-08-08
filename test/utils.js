'use strict';

require('mocha');
const assert = require('assert').strict;
const utils = require('../lib/utils');

describe('utils', () => {
  describe('.trailingIndent', () => {
    it('should get the trailing indentation amount from the given string', () => {
      assert.equal(utils.trailingIndent('  a\n  a'), '');
      assert.equal(utils.trailingIndent('  a\n  a  '), '');
      assert.equal(utils.trailingIndent('  a\n  a\n  '), '  ');
      assert.equal(utils.trailingIndent('  a\n  a\n    '), '    ');
      assert.equal(utils.trailingIndent('     '), '     ');
    });
  });
});
