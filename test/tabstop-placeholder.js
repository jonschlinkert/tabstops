'use strict';

require('mocha');
const assert = require('assert').strict;
const { Parser, parse } = require('../lib/Parser');
const { normalize } = require('../lib/utils');

const inner = input => {
  let ast = parse(input);
  let node = ast.nodes.find(n => n.type !== 'text');
  if (node) {
    return node.inner();
  }
};

describe('tabstop placeholders', () => {
  describe('parse', () => {
    it('should not choke on colon in placeholder value', () => {
      const ast = parse('${1:foo:bar}');
      const node = ast.nodes[0];
      assert.equal(node.nodes[1].value, 'foo:bar');
    });

    it('should work with empty placeholders', () => {
      const ast = parse('${1:}');
      const node = ast.nodes[0];
      assert.equal(node.nodes[1].value, '');
    });
  });

  describe('mirrors', () => {
    it('should work with mirrors', () => {
      const input = '<${1:p}>$TM_SELECTED_TEXT</${1/\s.*//}>';
      const ast = parse(input);
      const fn = ast.compile();
      assert.equal(fn(), '<p>TM_SELECTED_TEXT</p>');
    });
  });

  describe('compile', () => {
    let snippet, ast;

    beforeEach(() => {
      snippet = new Parser('<${1:This is a placeholder}>');
      ast = snippet.parse();
    });

    it('should return a function', () => {
      const fn = ast.compile();
      assert.equal(typeof fn, 'function');
    });

    it('should render a cached tabstop value', () => {
      snippet.tabstops.set(1, 'bar-baz.txt');
      const fn = ast.compile();
      assert.equal(fn({ TM_FILENAME: 'foo.txt' }), '<bar-baz.txt>');
    });

    it('should use a tabstop value defined after compile fn is created', () => {
      const fn = ast.compile();
      snippet.tabstops.set(1, 'bar-baz.txt');
      assert.equal(fn({ TM_FILENAME: 'foo.txt' }), '<bar-baz.txt>');
    });

    it('should render the placeholder value when tabstop value is not defined', () => {
      const fn = ast.compile();
      assert.equal(fn(), '<This is a placeholder>');
    });
  });

  describe('tabstop nested placeholders - compile', () => {
    let snippet, ast;

    beforeEach(() => {
      snippet = new Parser('<${1:This is a placeholder}>');
      ast = snippet.parse();
    });

    it('should return a function', () => {
      const fn = ast.compile();
      assert.equal(typeof fn, 'function');
    });

    it('should render a cached tabstop value', () => {
      snippet.tabstops.set(1, 'bar-baz.txt');
      const fn = ast.compile();
      assert.equal(fn({ TM_FILENAME: 'foo.txt' }), '<bar-baz.txt>');
    });

    it('should render the placeholder value when tabstop value is not defined', () => {
      const fn = ast.compile();
      assert.equal(fn(), '<This is a placeholder>');
    });
  });

  describe('inner', () => {
    const fixtures = [
      ['foo{${1:default}}bar', '1:default'],
      ['foo{${1:default}}bar', '1:default']
    ];

    for (let fixture of fixtures) {
      it(`should return inner value for: "${normalize(fixture[0])}"`, () => {
        assert.equal(inner(fixture[0]), fixture[1]);
      });
    }
  });

  describe('escaped', () => {
    const fixtures = [
      ['foo \\${1:default} bar', undefined ],
      ['foo ${1:default\\} bar', undefined ],
      ['foo ${1.:default} bar', undefined],
      ['foo \\$1 bar', undefined ]
    ];

    for (let fixture of fixtures) {
      it(`should not match escaped characters: "${normalize(fixture[0])}"`, () => {
        assert.equal(inner(fixture[0]), fixture[1]);
      });
    }
  });
});
