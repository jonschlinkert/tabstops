'use strict';

require('mocha');
const assert = require('assert').strict;
const { compile, parse } = require('../lib/Parser');

const render = (input, expected) => {
  const ast = parse(input);
  const fn = ast.compile();
  return [fn(), expected];
};

describe('variable placeholders', () => {
  describe('parse', () => {
    it('should not choke on colon in placeholder value', () => {
      const ast = parse('${TM_SELECTED_TEXT:foo:bar}');
      const node = ast.nodes[0];
      assert.equal(node.nodes[1].value, 'foo:bar');
    });

    it('should work with empty placeholders', () => {
      const ast = parse('${name:}');
      const node = ast.nodes[0];
      assert.equal(node.emptyPlaceholder, true);
      assert.equal(node.nodes[1].type, 'text');
      assert.equal(node.nodes[1].value, '');
    });
  });

  describe('compile', () => {
    it('should return a function', () => {
      const ast = parse('<${TM_FILENAME:This is a placeholder}>');
      const fn = ast.compile();
      assert.equal(typeof fn, 'function');
    });

    it('should render a value when passed on the context', () => {
      const ast = parse('<${TM_FILENAME:This is a placeholder}>');
      const fn = ast.compile();
      assert.equal(fn({ TM_FILENAME: 'foo.txt' }), '<foo.txt>');
    });

    it('should render the placeholder value when context value is not defined', () => {
      const ast = parse('<${TM_FILENAME:This is a placeholder}>');
      const fn = ast.compile();
      assert.equal(fn(), '<This is a placeholder>');
    });
  });

  describe('vscode tests', () => {
    it('Parser, valid placeholder with defaults', () => {
      assert.equal(compile('${1:value}')(), 'value');
    });

    it('Parser, invalid transform', () => {
      assert.equal(compile('${TM_FILENAME/(\\w+)\\.js/$1/g${2:foobar}')(), '${TM_FILENAME/(\\w+)\\.js/$1/g${2:foobar}');
    });

    it('Parser, invalid placeholder with defaults', () => {
      assert.equal(compile('${1:bar${2:foo}bar}')(), 'barfoobar');
      assert.equal(compile('${1:bar${2:foobar}')(), '${1:barfoobar');
    });

    it('Parser, valid variables with defaults', () => {
      assert.equal(compile('${name:value}')(), 'value');
    });

    it('Parser, invalid variables with defaults', () => {
      assert.equal(compile('${name:value')(), '${name:value');
      assert.equal(compile('${a:bar${b:foobar}')(), '${a:barfoobar');
    });
  });

  describe('placeholders', () => {
    it('should render placeholder values', () => {
      assert.equal(...render('${name:value}', 'value'));
      assert.equal(...render('${1:value}', 'value'));
      assert.equal(...render('${1:bar${2:foo}bar}', 'barfoobar'));
    });

    it('should not use placeholders defined on previous same-name vars', () => {
      assert.equal(...render('${foo:bar} $foo', 'bar foo'));
    });
  });

  describe('invalid variable placeholders', () => {
    it('should ignore invalid patterns', () => {
      assert.doesNotThrow(() => assert.equal(...render('${name:value', '${name:value')));
      assert.doesNotThrow(() => assert.equal(...render('${1:bar${2:foobar}', '${1:barfoobar')));
    });
  });
});
