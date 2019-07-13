'use strict';

require('mocha');
const fs = require('fs');
const path = require('path');
const assert = require('assert').strict;
const parse = require('../lib/parse');

describe('parse - textmate snippet', () => {
  it('should parse a TextMate style snippet', () => {
    let str = fs.readFileSync(path.join(__dirname, 'fixtures/rcc.sublime-snippet'), 'utf8');
    parse.snippet(str);
  });

  it('should parse a XML snippet', () => {
    let str = fs.readFileSync(path.join(__dirname, 'fixtures/snippet.xml'), 'utf8');
    parse.snippet(str);
  });
});
