'use strict';

require('mocha');
const assert = require('assert').strict;
const Parser = require('../lib/Parser');

describe('.render', () => {
  it('should render a value with a variable passed to the constructor', () => {
    let parser = new Parser('foo ${name} bar');
    assert.equal(parser.render(), 'foo name bar');
    assert.equal(parser.render({ name: 'Brian' }), 'foo Brian bar');
    // assert.equal(parser.render({ name: '' }), 'foo Brian bar');
  });

  it('should render a value with a tabstop passed to the constructor', () => {
    let parser = new Parser('foo ${1} bar');
    assert.equal(parser.render(), 'foo  bar');
  });
});
