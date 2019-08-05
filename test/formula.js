'use strict';

require('mocha');
const assert = require('assert').strict;
const { parse, Parser } = require('../lib/Parser');

const formula = (input, fn) => {
  const ast = parse(input);
  return fn ? fn(ast) : ast.nodes[0];
};

describe('Formula fields', () => {
  describe('parse', () => {
    it('should parse placeholder formula', () => {
      let ctx = { foo: 100, bar: 10, baz: 7, qux: 2, fe: { z: 4 } };
      let str = '${item1=foo - (bar + baz) * qux / fe.z} ${item2=10} ${total=item1+item2}';
      let snippet = new Parser(str);
      let ast = snippet.parse();
      let fn = ast.compile();
      console.log(fn(ctx));
      console.log([snippet.variables.get('item1')]); //=> 91.5
      console.log([snippet.variables.get('item2')]); //=> 10
      console.log([snippet.variables.get('total')]); //=> 101.5

      console.log(formula('${total=one + 3}').compile()({ one: 1 }));
      console.log(formula('${total=1 / 3}').compile()());
      console.log(formula('${total=1 - 3}').compile()());
      console.log(formula('${total=4 * 3}').compile()());
      // assert.deepEqual(formula('${total=sum1+sum2}'), ['one', 'two', 'three']);
      // assert.deepEqual(formula('${1|one,  two,    three|}'), ['one', '  two', '    three']);
    });
  });
});
