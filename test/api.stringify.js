'use strict';

require('mocha');
const assert = require('assert').strict;
const Snippet = require('../lib/snippet');

const stringify = input => {
  let snippet = new Snippet(input);
  let ast = snippet.parse();
  return ast.stringify();
};

describe('stringify (mostly ported from vscode tests)', () => {
  it('should stringify escaped text', () => {
    assert.equal(stringify('foo$0'), 'foo$0');
    assert.equal(stringify('foo\\$0'), 'foo\\$0');
    assert.equal(stringify('f$1oo$0'), 'f$1oo$0');
    assert.equal(stringify('${1:foo}$0'), '${1:foo}$0');
    assert.equal(stringify('$'), '$');
    assert.equal(stringify('$1'), '$1');
    assert.equal(stringify('\\$1'), '\\$1');
  });

  it('should stringify', () => {
    assert.equal(stringify('this is text'), 'this is text');
    assert.equal(stringify('this ${1:is ${2:nested with $var}}'), 'this ${1:is ${2:nested with $var}}');
    assert.equal(stringify('this ${1:is ${2:nested with $var}}}'), 'this ${1:is ${2:nested with $var}}}');
    assert.equal(stringify('console.log(${1|not\\, not, five, 5, 1   23|});'), 'console.log(${1|not\\, not, five, 5, 1   23|});');
    assert.equal(stringify('console.log(${1|not\\, not, \\| five, 5, 1   23|});'), 'console.log(${1|not\\, not, \\| five, 5, 1   23|});');
    assert.equal(stringify('this is text'), 'this is text');
    assert.equal(stringify('this ${1:is ${2:nested with $var}}'), 'this ${1:is ${2:nested with $var}}');
    assert.equal(stringify('this ${1:is ${2:nested with $var}}}'), 'this ${1:is ${2:nested with $var}}}');
    assert.equal(stringify('this ${1:is ${2:nested with $var}} and repeating $1'), 'this ${1:is ${2:nested with $var}} and repeating $1');
    assert.equal(stringify('console.log(${1|not\\, not, five, 5, 1   23|});'), 'console.log(${1|not\\, not, five, 5, 1   23|});');
    assert.equal(stringify('console.log(${1|not\\, not, \\| five, 5, 1   23|});'), 'console.log(${1|not\\, not, \\| five, 5, 1   23|});');
  });

  it('should stringify plain text', () => {
    assert.equal(stringify('$'), '$');
    assert.equal(stringify('\\\\$'), '\\\\$');
    assert.equal(stringify('{'), '{');
    assert.equal(stringify('\\}'), '\\}');
    assert.equal(stringify('\\abc'), '\\abc');
    assert.equal(stringify('foo${f:\\}}bar'), 'foo${f:\\}}bar');
    assert.equal(stringify('\\{'), '\\{');
    assert.equal(stringify('I need \\\\\\$'), 'I need \\\\\\$');
    assert.equal(stringify('\\'), '\\');
    assert.equal(stringify('\\{{'), '\\{{');
    assert.equal(stringify('{{'), '{{');
    assert.equal(stringify('{{dd'), '{{dd');
    assert.equal(stringify('}}'), '}}');
    assert.equal(stringify('ff}}'), 'ff}}');
    assert.equal(stringify('farboo'), 'farboo');
    assert.equal(stringify('far{{}}boo'), 'far{{}}boo');
    assert.equal(stringify('far{{123}}boo'), 'far{{123}}boo');
    assert.equal(stringify('far\\{{123}}boo'), 'far\\{{123}}boo');
    assert.equal(stringify('far{{id:bern}}boo'), 'far{{id:bern}}boo');
    assert.equal(stringify('far{{id:bern {{basel}}}}boo'), 'far{{id:bern {{basel}}}}boo');
    assert.equal(stringify('far{{id:bern {{id:basel}}}}boo'), 'far{{id:bern {{id:basel}}}}boo');
    assert.equal(stringify('far{{id:bern {{id2:basel}}}}boo'), 'far{{id:bern {{id2:basel}}}}boo');
  });

  it('should stringify a variable', () => {
    assert.equal(stringify('Name: ${name:Jon}'), 'Name: ${name:Jon}');
  });
});
