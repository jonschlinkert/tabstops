'use strict';

require('mocha');
const assert = require('assert').strict;
const Parser = require('../lib/Parser');

const parse = (input, options) => {
  let parser = new Parser(input, options);
  return parser.parse();
};

describe('.parse', () => {
  it('should parse the value passed to .parse', () => {
    let parser = new Parser();
    assert.equal(parser.parse('foo').nodes[0].type, 'text');
    assert.equal(parser.parse('foo').nodes[0].value, 'foo');
  });

  it('should not parse the same value more than once', () => {
    let parser = new Parser('foo');
    let ast = parser.parse();
    assert.equal(parser.parse(), ast);
  });

  it('should parse byte order marks', () => {
    assert.equal(parse('\ufeff').nodes[0].type, 'bom');
  });

  it('should add a $0 (zero) node if not defined', () => {
    let ast = parse('foo', { zero: true });
    assert.equal(ast.nodes[0].type, 'text');
    assert.equal(ast.nodes[0].value, 'foo');
    assert.equal(ast.nodes[1].type, 'tabstop');
    assert.equal(ast.nodes[1].value, '$0');
  });
});
