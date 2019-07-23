'use strict';

require('mocha');
const assert = require('assert').strict;
const { parse, compile, render } = require('../lib/snippet');

describe('stringify', () => {
  it('should stringify a variable', () => {
    const fn = compile('${name:Jon}');
    console.log([fn({ name: 'Brian' })])

  });
});
