'use strict';

require('mocha');
const assert = require('assert').strict;
const render = require('../lib/render');

describe('placeholders - render', () => {
  it('should render a template literal', async () => {
    assert.equal(await render('${foo}', { foo: 'bar' }), 'bar');
    assert.equal(await render('(${foo})', { foo: 'bar' }), '(bar)');
  });

  it('should render nested literals', async () => {
    assert.equal(await render('${foo:${ABC}}', {}), '');
    assert.equal(await render('(${foo:${ABC}})', {}), '()');
    assert.equal(await render('(${foo:(${ABC})})', {}), '(())');
    assert.equal(await render('(${foo:(${ABC})})', { foo: 'bar' }), '(bar)');
    assert.equal(await render('${foo:${ABC}}', { ABC: 'bar' }), 'bar');
    assert.equal(await render('${foo:${ABC}}', { ABC: 'bar', foo: 'xyz' }), 'xyz');
    assert.equal(await render('(${foo:${ABC}})', { ABC: 'bar' }), '(bar)');
    assert.equal(await render('(${foo:(${ABC})})', { ABC: 'bar' }), '((bar))');
    assert.equal(await render('(${foo:(${ABC})})', { foo: 'bar' }), '(bar)');
    assert.equal(await render('(${foo:${ABC}})', { foo: 'bar', ABC: 'XYZ' }), '(bar)');
    assert.equal(await render('(${foo:${ABC}})', { foo: 'bar' }), '(bar)');
  });

  it('should render multiple nested template literals', async () => {
    assert.equal(await render('${4:${homepage:https://github.com/${6:${username}}}}'), 'https://github.com/');
    assert.equal(await render('${homepage:https://github.com/${6:${username}}}'), 'https://github.com/');
    assert.equal(await render('${homepage:https://github.com/${6:${username}}}', { homepage: 'https://github.com/jonschlinkert'}), 'https://github.com/jonschlinkert');
    assert.equal(await render('${homepage:https://github.com/${6:${username}}}', { username: 'jonschlinkert'}), 'https://github.com/jonschlinkert');
    assert.equal(await render('${homepage:https://github.com/${6:${username}}}', { username: 'jonschlinkert', homepage: 'https://github.com/doowb' }), 'https://github.com/doowb');
    assert.equal(await render('${foo:before ${ABC} middle ${XYZ} after}', { ABC: 'one', XYZ: 'two' }), 'before one middle two after');
    assert.equal(await render('${foo:before ${ABC} middle ${XYZ} after}', { foo: 'bar' }), 'bar');
  });

  it('should parse tabstops with placeholders', async () => {
    assert.equal(await render('${4:homepage}', { homepage: 'foo' }), 'foo');
    assert.equal(await render('${4:${homepage}}', { homepage: 'foo' }), 'foo');
  });
});
