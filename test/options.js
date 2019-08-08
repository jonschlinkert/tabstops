'use strict';

require('mocha');
const assert = require('assert').strict;
const Session = require('..');

const render = (input, options, data) => {
  let session = new Session(input, options);
  return session.render(data);
};

describe('options', () => {
  describe('.indent', () => {
    it('should indent when defined as a string', () => {
      assert.equal(render('foo${1:bar}}', { indent: ' ' }), ' foobar}');
      assert.equal(render('foo${1:bar}}', { indent: '  ' }), '  foobar}');
      assert.equal(render('foo${1:bar}}', { indent: '   ' }), '   foobar}');
    });

    it('should indent when defined as a number', () => {
      assert.equal(render('foo${1:bar}}', { indent: 1 }), ' foobar}');
      assert.equal(render('foo${1:bar}}', { indent: 2 }), '  foobar}');
      assert.equal(render('foo${1:bar}}', { indent: 3 }), '   foobar}');
    });

    it('should indent multi-line snippets', () => {
      assert.equal(render('foo\nbar\nbaz', { indent: 1 }), ' foo\n bar\n baz');
      assert.equal(render('foo\nbar\nbaz', { indent: 2 }), '  foo\n  bar\n  baz');
      assert.equal(render('foo\nbar\nbaz', { indent: 3 }), '   foo\n   bar\n   baz');
    });
  });
});
