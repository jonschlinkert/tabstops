'use strict';

require('mocha');
const assert = require('assert');
const { Session, Parser } = require('..');
const { normalize } = require('../lib/utils');
const { pick, visit } = require('./support');

const parse = input => {
  const session = new Session(input);
  const ast = session.parse();

  ast.visit(node => {
    if (node.loc) node.range = node.loc.range;
    delete node.loc;
    delete node.fields;
    delete node.match;
    delete node.compile;
    delete node.source;
    delete node.variables;
    delete node.tabstops;
    delete node.initial;
  });

  return ast;
};

// TODO: convert all of these tests to use tokens() instead of parse()
const tokens = input => {
  const session = new Session(input);
  const ast = session.parse();
  const arr = [];

  visit(ast, node => {
    if (node.loc) node.range = node.loc.range;
    arr.push(pick(node, ['type', 'name', 'value', 'range']));
  });

  return arr;
};

const inner = input => {
  let ast = parse(input);
  let node = ast.nodes.find(n => n.type !== 'text');
  if (node) {
    return node.inner();
  }
};

describe('variables', () => {
  describe('parse', () => {
    it('should parse a variable', () => {
      assert.deepEqual(tokens('foo $TM_FILEPATH bar'), [
        { type: 'root', range: [0, 20] },
        { type: 'text', range: [0, 4], value: 'foo ' },
        { type: 'variable', range: [4, 16], name: 'TM_FILEPATH', value: '$TM_FILEPATH' },
        { type: 'text', range: [16, 20], value: ' bar' }
      ]);
    });

    it('should add correct .loc to nodes', () => {
      let input = 'foo $TM_FILEPATH bar';
      let ast = Parser.parse(input);
      assert.equal(input.slice(...ast.find('text').loc.range), 'foo ');
      assert.equal(input.slice(...ast.find('variable').loc.range), '$TM_FILEPATH');
      assert.equal(input.slice(...ast.nodes.pop().loc.range), ' bar');
    });

    it('should parse a textmate variable', () => {
      assert.deepEqual(parse('textbf{${TM_SELECTED_TEXT:no text was selected}}'), {
        type: 'root',
        range: [0, 48],
        nodes: [
          { type: 'text', range: [0, 7], value: 'textbf{' },
          {
            type: 'variable_placeholder',
            range: [7, 47],
            name: 'TM_SELECTED_TEXT',
            value: '${TM_SELECTED_TEXT:',
            nodes: [
              {
                range: [7, 26],
                type: 'open',
                value: '${TM_SELECTED_TEXT:'
              },
              {
                range: [26, 46],
                type: 'text',
                value: 'no text was selected'
              },
              {
                range: [46, 47],
                type: 'close',
                value: '}'
              }
            ]
          },
          { type: 'text', range: [47, 48], value: '}' }
        ]
      });
    });

    it('should parse an alphanumeric tabstop variable 1', () => {
      let ast = parse('foo $FOO123BAR bar');

      assert.deepEqual(ast, {
        type: 'root',
        range: [0, 18],
        nodes: [
          { type: 'text', range: [0, 4], value: 'foo ' },
          { type: 'variable', range: [4, 14], name: 'FOO123BAR', value: '$FOO123BAR' },
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
          { type: 'variable', range: [4, 14], name: 'FOO123BAR', value: '$FOO123BAR' },
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
          { type: 'variable', range: [4, 14], name: 'FOO123BAR', value: '$FOO123BAR' },
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
          { type: 'variable', range: [4, 14], name: 'FOO123BAR', value: '$FOO123BAR' },
          { type: 'text', range: [14, 21], value: '\\}\nbar\n' },
          { type: 'variable', range: [21, 25], name: 'BAZ', value: '$BAZ' }
        ]
      });
    });
  });

  describe('stringify', () => {
    const stringify = (input, fn, expected = input) => {
      let ast = parse(input);
      let node = (fn ? fn(ast) : ast);
      let output = node.stringify();
      return [output, expected];
    };

    it('should stringify variable nodes', () => {
      const find = ast => ast.find('variable_placeholder');
      assert.equal(...stringify('textbf{${TM_SELECTED_TEXT:no text was selected}}', find, '${TM_SELECTED_TEXT:no text was selected}'));
      assert.equal(...stringify('textbf{${TM_SELECTED_TEXT:no text was selected}}'));
      assert.equal(...stringify('foo $FOO123BAR bar'));
      assert.equal(...stringify('foo $FOO123BAR} bar'));
      assert.equal(...stringify('foo $FOO123BAR\\} bar'));
      assert.equal(...stringify('foo $FOO123BAR\\}\nbar\n$BAZ'));
    });
  });

  describe('inner', () => {
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
        'foo ${FOO123BAR} bar',
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
      ],
      [
        // should match "\\" when it's the last character in the string
        'foo $FOO123BAR\\}\nbar\n$BAZ\\',
        'FOO123BAR'
      ]
    ];

    for (let fixture of fixtures) {
      it(`should return inner value for: "${normalize(fixture[0])}"`, () => {
        assert.equal(inner(fixture[0]), fixture[1]);
      });
    }
  });

  describe('escaped', () => {
    const fixtures = [
      [
        'foo \\${FOO123BAR} bar',
        undefined
      ],
      [
        'foo ${FOO123BAR\\} bar',
        undefined
      ],
      [
        'foo ${FOO123BAR.} bar',
        undefined
      ],
      [
        'foo \\$FOO123BAR bar',
        undefined
      ]
    ];

    for (let fixture of fixtures) {
      it(`should not match escaped characters: "${normalize(fixture[0])}"`, () => {
        assert.equal(inner(fixture[0]), fixture[1]);
      });
    }
  });
});
