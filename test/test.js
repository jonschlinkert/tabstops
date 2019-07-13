'use strict';

require('mocha');
const assert = require('assert').strict;
const render = require('../lib/render');

describe('literals', () => {
  it('should render a template variable', async () => {
    assert.equal(await render('$'), '$');
    assert.equal(await render('\\\\$'), '\\\\$');
    assert.equal(await render('{'), '{');
    assert.equal(await render('\\}'), '\\}');
    assert.equal(await render('\\abc'), '\\abc');
    assert.equal(await render('foo${f:\\}}bar'), 'foo\\}bar');
    assert.equal(await render('foo${f:\\}}bar', { f: 'VALUE' }), 'fooVALUEbar');
    assert.equal(await render('\\{'), '\\{');
    assert.equal(await render('I need \\\\\\$'), 'I need \\\\\\$');
    assert.equal(await render('\\'), '\\');
    assert.equal(await render('\\{{'), '\\{{');
    assert.equal(await render('{{'), '{{');
    assert.equal(await render('{{dd'), '{{dd');
    assert.equal(await render('}}'), '}}');
    assert.equal(await render('ff}}'), 'ff}}');
    assert.equal(await render('foobar'), 'foobar');
    assert.equal(await render('foo{{}}bar'), 'foo{{}}bar');
    assert.equal(await render('foo{{123}}bar'), 'foo{{123}}bar');
    assert.equal(await render('foo\\{{123}}bar'), 'foo\\{{123}}bar');
    assert.equal(await render('foo{{faz:baz}}bar'), 'foo{{faz:baz}}bar');
    assert.equal(await render('foo{{faz:baz {{qux}}}}bar'), 'foo{{faz:baz {{qux}}}}bar');
    assert.equal(await render('foo{{faz:baz {{faz:qux}}}}bar'), 'foo{{faz:baz {{faz:qux}}}}bar');
  });

  it('should render literal code', async () => {
    assert.equal(await render('foo`123`bar'), 'foo`123`bar');
    assert.equal(await render('foo\\`123\\`bar'), 'foo\\`123\\`bar');
  });

  it('should render variables/tabstop', async () => {
    assert.equal(await render('$foo-bar'), '-bar');
    assert.equal(await render('\\$foo-bar'), '\\$foo-bar');
    assert.equal(await render('foo$foobar'), 'foo');
    assert.equal(await render('foo${foobar}'), 'foo');
    assert.equal(await render('$123'), '');
    assert.equal(await render('$foobar'), '');
    assert.equal(await render('$foo12bar'), '');
    assert.equal(await render('000_${foo}_000'), '000__000');
    assert.equal(await render('FFF_${TM_SELECTED_TEXT}_FFF$0'), 'FFF__FFF');
  });
});
