'use strict';

require('mocha');
const assert = require('assert');
const render = require('../lib/render');

describe('template literals', () => {
  it('should render a template literal', () => {
    assert.equal(render('\${TM_FILENAME/(.+)\\..+|.*/$1/:ComponentName}', { foo: 'bar' }), '(bar)');
  });
});
