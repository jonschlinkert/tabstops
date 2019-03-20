'use strict';

require('mocha');
const assert = require('assert');
const render = require('../lib/render');

describe('variables - render', () => {
  it('should render a template variable', async () => {
    assert.equal(await render('$FOO', { FOO: 'bar' }), 'bar');
    assert.equal(await render('($FOO)', { FOO: 'bar' }), '(bar)');
    assert.equal(await render('Foo ${ENV_FFFOOFOFOFOF} Bar'), 'Foo  Bar');
  });

  it('should render consecutive template variables', async () => {
    assert.equal(await render('$FOO$BAR', { FOO: 'one', BAR: 'two' }), 'onetwo');
    assert.equal(await render('$FOO $BAR', { FOO: 'one', BAR: 'two' }), 'one two');
    assert.equal(await render('$A$B$C', { A: 'one', B: 'two', C: 'three' }), 'onetwothree');
    assert.equal(await render('$A $B $C', { A: 'one', B: 'two', C: 'three' }), 'one two three');
  });

  it('should render nested variables', async () => {
    assert.equal(await render('$FOO $BAR', { FOO: 'one', BAR: 'two' }), 'one two');
    assert.equal(await render('$A$B$C', { A: 'one', B: 'two', C: 'three' }), 'onetwothree');
    assert.equal(await render('$A $B $C', { A: 'one', B: 'two', C: 'three' }), 'one two three');
  });
});
