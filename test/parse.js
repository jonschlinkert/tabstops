'use strict';

require('mocha');
const assert = require('assert').strict;
const parse = require('../lib/parse/parse');

describe('parse', () => {
  it('should parse a variable', () => {
    assert.rejects(async() => await parse('foo \\00 bar'), /Octal/);
  });
});
