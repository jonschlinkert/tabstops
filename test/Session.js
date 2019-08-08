'use strict';

require('mocha');
const assert = require('assert').strict;
const Session = require('..');

const render = (input, options, data) => {
  let session = new Session(input, options);
  return session.render(data);
};

describe('Session', () => {
  describe('.render', () => {
    it('should render a snippet', () => {
      assert.equal(render('foo${1:bar}}'), 'foobar}');
      assert.equal(render('foo${1:bar}${2:foo}}'), 'foobarfoo}');
      assert.equal(render('foo${1:bar\\}${2:foo}}'), 'foobar\\}foo');
    });
  });
});
