'use strict';

require('mocha');
const assert = require('assert').strict;
const { parse, Parser } = require('../lib/Parser');

const formula = (input, fn) => {
  const ast = parse(input);
  return fn ? fn(ast) : ast.nodes[0];
};

describe('formula', () => {
  describe('parse', () => {
    it('should parse placeholder formula', () => {

const str = `
Favorite fruits?

  \${[x]:Apple}
  \${[ ]:Banana}
  \${[x]:Strawberry}
  \${[]:Lemon}
  \${[]:Watermelon:Pick this one}
`;

let snippet = new Parser(str);
let ast = snippet.parse();
let fn = ast.compile();
// console.log(ast.nodes[1]);
console.log(fn(ctx));

    });
  });
});
