'use strict';

require('mocha');
const assert = require('assert');
const render = require('../lib/render');
const helpers = require('../lib/helpers');

describe('placeholder transforms - render', () => {
  it('should render placeholder transforms', async () => {
    let locals = { helpers};
    assert.equal(await render('Foo ${1/./=/g} Bar'), 'Foo  Bar');
    assert.equal(await render('${1:foo}\n${1/./=/g}'), 'foo\n===');
    assert.equal(await render('Foo ${1/(.)/${1}/g} Bar'), 'Foo  Bar');
    assert.equal(await render('${1:foo}\n${1/(.)/${1:upcase}/g}', locals), 'foo\nFOO');
    assert.equal(await render('${1:foo}\n${1/(.)/${1:uppercase}/g}', locals), 'foo\nFOO');
    assert.equal(await render('${1:FOO}\n${1/(.)/${1:lowercase}/g}', locals), 'FOO\nfoo');
    assert.equal(await render('${1:FOO}\n${1/(.)/${1:downcase}/g}', locals), 'FOO\nfoo');
    assert.equal(await render('${1:FOO}\n${1/(.)/${1:downcase}/g}\n${1/(.)/${1:downcase}/g}\n${1/(.)/${1:downcase}/g}', locals), 'FOO\nfoo\nfoo\nfoo');
  });
});
