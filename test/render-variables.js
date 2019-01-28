'use strict';

require('mocha');
const assert = require('assert');
const parse = require('../lib/parse');
const render = require('../lib/render');

describe('variables - render', () => {
  it('should render a template variable', () => {
    assert.equal(render('$FOO', { FOO: 'bar' }), 'bar');
    assert.equal(render('($FOO)', { FOO: 'bar' }), '(bar)');
  });

  it('should render consecutive template variables', () => {
    assert.equal(render('$FOO$BAR', { FOO: 'one', BAR: 'two' }), 'onetwo');
    assert.equal(render('$FOO $BAR', { FOO: 'one', BAR: 'two' }), 'one two');
    assert.equal(render('$A$B$C', { A: 'one', B: 'two', C: 'three' }), 'onetwothree');
    assert.equal(render('$A $B $C', { A: 'one', B: 'two', C: 'three' }), 'one two three');
  });
});
