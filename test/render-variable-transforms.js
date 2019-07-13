'use strict';

require('mocha');
const assert = require('assert').strict;
const render = require('../lib/render');
const helpers = require('../lib/helpers');

describe('variable transforms - render', () => {
  it('should render transforms', async () => {
    const locals = { TM_FILENAME: 'test.js', ComponentName: 'FooBar' };
    assert.equal(await render('${TM_FILENAME/(.*)\\..+$/$1/gi}', locals), 'test');
    assert.equal(await render('${TM_FILENAME/(.*)\\}.+$/$1/gi}', locals), '');
    assert.equal(await render('${TM_FILEPATH/(.*)\\/.+$/$1/gi}', locals), '');
    assert.equal(await render('${1:${TM_FILENAME/(.+)\\..+|.*/$1/:ComponentName}}', locals), 'test');
    assert.equal(await render('${foobar\\|foobar/(foo)(bar)/$1${_}$2/g}', {}), 'foo_barfoo_bar');
    assert.equal(await render('${foobar\\|foobar/(foo)(bar)/${1}_$2/g}', {}), 'foo_barfoo_bar');
    assert.equal(await render('${foobar\\|foobar/(foo)(bar)/${1}_${2}/g}', {}), 'foo_barfoo_bar');
    assert.equal(await render('${1:foobarfoobar}${1/(foo)(bar)/${1}_${2}/g}', {}), 'foobarfoobarfoo_barfoo_bar');
  });

  it('what is this supposed to do? anyone?', async () => {
    assert.equal(await render('${1:${SomeClass/(.+)\\..+|.*/$1/:ComponentName}}'), '');
  });

  it('should render transforms with helpers', async () => {
    const locals = { TM_FILENAME: 'test.js', ComponentName: 'FooBar', helpers };
    assert.equal(await render('${TM_FILENAME/^(.*)$/${1:upcase}/gi}', locals), 'TEST.JS');
  });
});

