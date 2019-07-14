'use strict';

require('mocha');
const assert = require('assert');
const Snippet = require('../lib/Snippet');
const { define } = require('../lib/utils');

const parse = input => {
  const snippet = new Snippet(input);
  const ast = snippet.parse();
  ast.visit(node => {
    node.range = node.loc.range;
    define(node, 'tabstops', node.tabstops);
    define(node, 'source', node.source);
    define(node, 'open', node.open);
    define(node, 'loc', node.loc);
    if (node.variable) delete node.value;
    delete node.close;
    node.replace(node);
  });
  return ast;
};

describe('variables', () => {
  describe('parse', () => {
    it('should parse a variable', () => {
      assert.deepEqual(parse('foo $TM_FILEPATH bar'), {
        type: 'root',
        range: [0, 20],
        nodes: [
          { type: 'text', range: [0, 4], value: 'foo ' },
          { type: 'variable', range: [4, 16], variable: 'TM_FILEPATH' },
          { type: 'text', range: [16, 20], value: ' bar' }
        ]
      });
    });

    it('should add correct .loc to nodes', () => {
      let input = 'foo $TM_FILEPATH bar';
      let ast = parse(input);
      assert.equal(input.slice(...ast.find('text').range), 'foo ');
      assert.equal(input.slice(...ast.find('variable').range), '$TM_FILEPATH');
      assert.equal(input.slice(...ast.nodes.pop().range), ' bar');
    });

    it('should parse a textmate variable', () => {
      assert.deepEqual(parse('textbf{${TM_SELECTED_TEXT:no text was selected}}'), {
        type: 'root',
        range: [0, 48],
        nodes: [
          { type: 'text', range: [0, 7], value: 'textbf{' },
          {
            type: 'placeholder',
            range: [7, 47],
            variable: 'TM_SELECTED_TEXT',
            nodes: [
              {
                output: '',
                range: [7, 26],
                type: 'open_brace',
                value: '${'
              },
              {
                range: [26, 46],
                type: 'text',
                value: 'no text was selected'
              },
              {
                output: '',
                range: [46, 47],
                type: 'close_brace',
                value: '}'
              }
            ]
          },
          { type: 'text', range: [47, 48], value: '}' }
        ]
      });
    });

    it('should parse an alphanumeric tabstop variable', () => {
      let ast = parse('foo $FOO123BAR bar');

      assert.deepEqual(ast, {
        type: 'root',
        range: [0, 18],
        nodes: [
          { type: 'text', range: [0, 4], value: 'foo ' },
          { type: 'variable', range: [4, 14], variable: 'FOO123BAR' },
          { type: 'text', range: [14, 18], value: ' bar' }
        ]
      });
    });

    it('should parse an alphanumeric tabstop variable', () => {
      let ast = parse('foo $FOO123BAR bar');

      assert.deepEqual(ast, {
        type: 'root',
        range: [0, 18],
        nodes: [
          { type: 'text', range: [0, 4], value: 'foo ' },
          { type: 'variable', range: [4, 14], variable: 'FOO123BAR' },
          { type: 'text', range: [14, 18], value: ' bar' }
        ]
      });
    });

    it('should correctly deal non-terminator right brace', () => {
      let ast = parse('foo $FOO123BAR} bar');

      assert.deepEqual(ast, {
        type: 'root',
        range: [0, 19],
        nodes: [
          { type: 'text', range: [0, 4], value: 'foo ' },
          { type: 'variable', range: [4, 14], variable: 'FOO123BAR' },
          { type: 'text', range: [14, 19], value: '} bar' }
        ]
      });
    });

    it('should correctly deal with escaped right brace', () => {
      let ast = parse('foo $FOO123BAR\\} bar');

      assert.deepEqual(ast, {
        type: 'root',
        range: [0, 20],
        nodes: [
          { type: 'text', range: [0, 4], value: 'foo ' },
          { type: 'variable', range: [4, 14], variable: 'FOO123BAR' },
          { type: 'text', range: [14, 20], value: '\\} bar' }
        ]
      });
    });

    it('should add range n[u]mbers when enabled', () => {
      let ast = parse('foo $FOO123BAR\\}\nbar\n$BAZ');

      assert.deepEqual(ast, {
        type: 'root',
        range: [0, 25],
        nodes: [
          { type: 'text', range: [0, 4], value: 'foo ' },
          { type: 'variable', range: [4, 14], variable: 'FOO123BAR' },
          { type: 'text', range: [14, 21], value: '\\}\nbar\n' },
          { type: 'variable', range: [21, 25], variable: 'BAZ' }
        ]
      });
    });
  });

  describe('stringify', () => {
    const stringify = (input, fn, expected = input) => {
      let ast = parse(input);
      let output = (fn ? fn(ast) : ast).stringify();
      return [expected, output];
    };

    it('should stringify variable nodes', () => {
      const find = ast => ast.find('placeholder');
      assert.equal(...stringify('textbf{${TM_SELECTED_TEXT:no text was selected}}', find, '${TM_SELECTED_TEXT:no text was selected}'));
      assert.equal(...stringify('textbf{${TM_SELECTED_TEXT:no text was selected}}'));
      assert.equal(...stringify('foo $FOO123BAR bar'));
      assert.equal(...stringify('foo $FOO123BAR} bar'));
      assert.equal(...stringify('foo $FOO123BAR\\} bar'));
      assert.equal(...stringify('foo $FOO123BAR\\}\nbar\n$BAZ'));
    });
  });

  describe('outer', () => {
    const outer = (input, fn, expected = input) => {
      let ast = parse(input);
      let actual = (fn ? fn(ast) : ast).outer();
      return [actual, expected];
    };

    it('should outer variable nodes', () => {
      const find = ast => ast.find('placeholder');
      assert.equal(...outer('textbf{${TM_SELECTED_TEXT:no text was selected}}', find, '${TM_SELECTED_TEXT:no text was selected}'));
      assert.equal(...outer('textbf{${TM_SELECTED_TEXT:no text was selected}}'));
      assert.equal(...outer('foo $FOO123BAR bar'));
      assert.equal(...outer('foo $FOO123BAR} bar'));
      assert.equal(...outer('foo $FOO123BAR\\} bar'));
      assert.equal(...outer('foo $FOO123BAR\\}\nbar\n$BAZ'));
    });
  });

  describe('inner', () => {
    const inner = input => {
      let ast = parse(input);
      let node = ast.nodes.find(n => n.type !== 'text');
      return node.inner();
    };

    const fixtures = [
      [
        'textbf{${TM_SELECTED_TEXT:no text was selected}}',
        'TM_SELECTED_TEXT:no text was selected'
      ],
      [
        'textbf{${TM_SELECTED_TEXT:no text was selected}}',
        'TM_SELECTED_TEXT:no text was selected'
      ],
      [
        'foo $FOO123BAR bar',
        'FOO123BAR'
      ],
      [
        'foo $FOO123BAR bar}',
        'FOO123BAR'
      ],
      [
        'foo $FOO123BAR bar\\}',
        'FOO123BAR'
      ],
      [
        'foo $FOO123BAR\\}\nbar\n$BAZ',
        'FOO123BAR'
      ]
    ];

    for (let fixture of fixtures) {
      it(`should return inner value for: "${fixture[0]}"`, () => {
        assert.equal(inner(fixture[0]), fixture[1]);
      });
    }
  });
});
