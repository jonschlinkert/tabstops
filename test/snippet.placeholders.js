'use strict';

require('mocha');
const assert = require('assert').strict;
const { Snippet, compile } = require('../lib/Snippet');
const { format } = require('../lib/utils');

const parse = input => {
  const snippet = new Snippet(input);
  return snippet.parse();
};

const render = (input, expected) => {
  try {
    const ast = parse(input);
    const fn = ast.compile();
    return [fn(), expected];
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const inner = input => {
  let ast = parse(input);
  let node = ast.nodes.find(n => n.type !== 'text');
  if (node) {
    return node.inner();
  }
};

describe('placeholders', () => {
  describe('variable placeholders - parse', () => {
    it('should not choke on colon in placeholder value', () => {
      const ast = parse('${TM_SELECTED_TEXT:foo:bar}');
      const node = ast.nodes[0];
      assert.equal(node.nodes[1].value, 'foo:bar');
    });
  });

  describe('variable placeholders - compile', () => {
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

  describe('variable placeholders with defaults', () => {
    it('should render default values', () => {
      assert.equal(...render('${name:value}', 'value'));
      assert.equal(...render('${1:value}', 'value'));
      assert.equal(...render('${1:bar${2:foo}bar}', 'barfoobar'));
    });
  });

  describe('invalid variable placeholders', () => {
    it.skip('should ignore invalid patterns', () => {
      assert.doesNotThrow(() => assert.equal(...render('${name:value', '${name:value')));
      assert.doesNotThrow(() => assert.equal(...render('${1:bar${2:foobar}', '${1:barfoobar')));
    });
  });

  describe('tabstop placeholders - parse', () => {
    it('should not choke on colon in placeholder value', () => {
      const ast = parse('${1:foo:bar}');
      const node = ast.nodes[0];
      assert.equal(node.nodes[1].value, 'foo:bar');
    });
  });

  describe('tabstop placeholders - compile', () => {
    let snippet, ast;

    beforeEach(() => {
      snippet = new Snippet('<${1:This is a placeholder}>');
      ast = snippet.parse();
    });

    it('should return a function', () => {
      const fn = ast.compile();
      assert.equal(typeof fn, 'function');
    });

    it('should render a cached tabstop value', () => {
      snippet.tabstops.set(1, 'bar-baz.txt')
      const fn = ast.compile();
      assert.equal(fn({ TM_FILENAME: 'foo.txt' }), '<bar-baz.txt>');
    });

    it('should use a tabstop value defined after compile fn is created', () => {
      const fn = ast.compile();
      snippet.tabstops.set(1, 'bar-baz.txt')
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
      snippet = new Snippet('<${1:This is a placeholder}>');
      ast = snippet.parse();
    });

    it('should return a function', () => {
      const fn = ast.compile();
      assert.equal(typeof fn, 'function');
    });

    it('should render a cached tabstop value', () => {
      snippet.tabstops.set(1, 'bar-baz.txt')
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
      [
        'foo{${1:default}}bar',
        '1:default'
      ],
      [
        'foo{${1:default}}bar',
        '1:default'
      ],
      [
        'foo $1 bar',
        '1'
      ],
      [
        'foo ${1} bar',
        '1'
      ],
      [
        'foo $1 bar}',
        '1'
      ],
      [
        'foo $1 bar\\}',
        '1'
      ],
      [
        'foo $1\\}\nbar\n$BAZ',
        '1'
      ],
      [
        // should match "\\" when it's the last character in the string
        'foo $1\\}\nbar\n$BAZ\\',
        '1'
      ]
    ];

    for (let fixture of fixtures) {
      it(`should return inner value for: "${format(fixture[0])}"`, () => {
        assert.equal(inner(fixture[0]), fixture[1]);
      });
    }
  });

  describe('escaped', () => {
    const fixtures = [
      [
        'foo \\${1} bar',
        undefined
      ],
      [
        'foo ${1\\} bar',
        undefined
      ],
      [
        'foo ${1.} bar',
        '1.'
      ],
      [
        'foo \\$1 bar',
        undefined
      ],
    ];

    for (let fixture of fixtures) {
      it(`should not match escaped characters: "${format(fixture[0])}"`, () => {
        assert.equal(inner(fixture[0]), fixture[1]);
      });
    }
  });
});
