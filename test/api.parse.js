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

  it('should add line numbers to nodes', () => {
    const input = `

        function someFunction(a, b, c) {
          \${snippet}
        }

    `;
    const ast = parse(input);

    assert.equal(ast.loc.start.line, 0);
    assert.equal(ast.loc.end.line, 6);

    assert.equal(ast.nodes[0].loc.start.line, 0);
    assert.equal(ast.nodes[0].loc.end.line, 3);

    assert.equal(ast.nodes[1].loc.start.line, 3);
    assert.equal(ast.nodes[1].loc.end.line, 3);

    assert.equal(ast.nodes[2].loc.start.line, 3);
    assert.equal(ast.nodes[2].loc.end.line, 6);
  });

  it('should get whitespace indentation amount before variable nodes', () => {
    const input = `

    function someFunction(a, b, c) {
      \${snippet}
    }

`;
    const ast = parse(input);
    const node = ast.nodes[1];
    const match = /([^\S\n]+)$/.exec(node.prev.value);
    assert.equal(node.indent, match[1]);
  });

  it('should get whitespace indentation amount before tabstop nodes', () => {
    const input = `

    function someFunction(a, b, c) {
      \$1
    }

`;
    const ast = parse(input);
    const node = ast.nodes[1];
    const match = /([^\S\n]+)$/.exec(node.prev.value);
    assert.equal(node.indent, match[1]);
  });

  it('should get whitespace indentation amount before nested tabstop nodes', () => {
    const input = `

    function someFunction(a, b, c) {
      \${1:$2}
    }

`;
    const ast = parse(input);
    const node = ast.nodes[1].nodes[1];
    assert.equal(node.indent, '      ');
  });

  it('should get whitespace indentation amount before deeply nested tabstop nodes', () => {
    const input = `

    function someFunction(a, b, c) {
      \${1:\${2:\${3:\${4}}}}
    }

`;
    const parser = new Parser(input);
    parser.parse(input);

    let stops = parser.fields.tabstop.get(4);
    let stop = stops[0];
    assert.equal(stop.indent, '      ');
  });

  it('should add a $0 (zero) node if not defined', () => {
    let ast = parse('foo', { zero: true });
    assert.equal(ast.nodes[0].type, 'text');
    assert.equal(ast.nodes[0].value, 'foo');
    assert.equal(ast.nodes[1].type, 'tabstop');
    assert.equal(ast.nodes[1].value, '$0');
  });
});
