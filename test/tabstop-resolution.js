'use strict';

require('mocha');
const assert = require('assert').strict;
const Parser = require('../lib/Parser');

const render = (input, data, stop) => {
  let parser = new Parser(input);
  let ast = parser.parse();
  let fn = ast.compile();

  if (Array.isArray(stop)) {
    parser.tabstops.set(...stop);
  }

  return fn(data);
};

const create = (input, options) => {
  let parser = new Parser(input, options);
  let ast = parser.parse();
  let fn = ast.compile();

  return {
    set(...args) {
      parser.tabstops.set(...args);
    },
    render(data) {
      return fn(data);
    }
  };
};

describe('tabstop resolution', () => {
  it('should return an empty string for undefined tabstops', () => {
    assert.equal(render('foo $1 bar'), 'foo  bar');
    assert.equal(render('foo $1 $1 $1 bar'), 'foo    bar');
    assert.equal(render('foo $1 $2 $3 bar'), 'foo    bar');

    assert.equal(render('foo ${1} bar'), 'foo  bar');
    assert.equal(render('foo ${1} ${1} ${1} bar'), 'foo    bar');
    assert.equal(render('foo ${1} ${2} ${3} bar'), 'foo    bar');

    assert.equal(render('foo ${1} $1 bar'), 'foo   bar');
    assert.equal(render('foo ${1} $1 ${1} bar'), 'foo    bar');
    assert.equal(render('foo ${1} $2 ${3} $4 bar'), 'foo     bar');
  });

  it('should use placeholders in subsequent tabstops', () => {
    assert.equal(render('foo ${1:A} $1 bar'), 'foo A A bar');
    assert.equal(render('foo ${1:A} $1 ${1} bar'), 'foo A A A bar');
  });

  it('should use the first placeholder in subsequent tabstops', () => {
    assert.equal(render('foo ${1:A} $1 bar'), 'foo A A bar');
    assert.equal(render('foo ${1:A} ${1:B} ${1:C} bar'), 'foo A A A bar');
  });

  it('should use the first placeholder from any tabstop', () => {
    assert.equal(render('foo $1 ${1:A} bar'), 'foo A A bar');
    assert.equal(render('foo ${1} ${1:B} $1 bar'), 'foo B B B bar');
  });

  it('should return an empty string for undefined tabstops', () => {
    const session = create('foo $1 $1 $1 bar');
    assert.equal(session.render(), 'foo    bar');

    session.set(1, 'V');
    assert.equal(session.render(), 'foo V V V bar');

    session.set(1, 'VA');
    assert.equal(session.render(), 'foo VA VA VA bar');

    session.set(1, 'VAL');
    assert.equal(session.render(), 'foo VAL VAL VAL bar');

    session.set(1, 'VALU');
    assert.equal(session.render(), 'foo VALU VALU VALU bar');

    session.set(1, 'VALUE');
    assert.equal(session.render(), 'foo VALUE VALUE VALUE bar');

    session.set(1, void 0);
    assert.equal(session.render(), 'foo    bar');
  });
});
