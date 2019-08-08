'use strict';

require('mocha');
const assert = require('assert').strict;
const Parser = require('../lib/Parser');

const render = (input, data, options) => {
  const snippet = new Parser(input, options);
  const ast = snippet.parse();
  const fn = ast.compile();
  return fn(data);
};

describe('Formula fields', () => {
  describe('when not enabled on options', () => {
    it('should not parse formula fields by default', () => {
      let input = `\${total=(foo + bar)}`;
      let snippet = new Parser(input);
      let ast = snippet.parse();
      let fn = ast.compile();
      assert.equal(fn(), input);
    });
  });

  describe('when options.extensions is enabled ', () => {
    it('should evaluate a formula field with numbers', () => {
      let opts = { extensions: true };
      assert.equal(render('${total=1+2}', null, opts), '3');
      assert.equal(render('${total=2+10}', null, opts), '12');
      assert.equal(render('${total=2 + 10 / 3}', null, opts), '5.333333333333334');
      assert.equal(render('${total=Math.round(2 + 10 / 3)}', null, opts), '5');
    });

    it('should evaluate a formula field with variables', () => {
      let opts = { extensions: true };
      let data = { a: 1, b: 21 };
      assert.equal(render('${total=a+b}', data, opts), '22');
      assert.equal(render('${total=2+10}', data, opts), '12');
      assert.equal(render('${total=2 + 10 / 3}', data, opts), '5.333333333333334');
      assert.equal(render('${total=Math.round(2 + 10 / 3)}', data, opts), '5');
    });

    it('should evaluate a formula field that references other fields', () => {
      let opts = { extensions: true };
      let data = { a: 1, b: 21 };
      assert.equal(render('${a=2} ${b=3} ${total=a+b}', null, opts), '2 3 5');
    });

    it('should use functions on the context', () => {
      let opts = { extensions: true };
      let data = {
        half(n) {
          return n / 2;
        },
        sum(...args) {
          return args.reduce((a, b) => a + b, 0);
        }
      };
      assert.equal(render('${a=2} ${b=3} ${total=sum(a, half(b))}', data, opts), '2 3 3.5');
      assert.equal(render('${total=sum(a, half(b))}', {...data, a: 10, b: 7}, opts), '13.5');
    });

    it('should expose properties from the node', () => {
      let opts = { extensions: true };
      assert.equal(render('${type=node.type}', null, opts), 'formula');
      assert.equal(render('a ${index=node.index} b', null, opts), 'a 1 b');
    });

    it('should add evaluated values to instance variables', () => {
      let opts = { extensions: true };
      let parser = new Parser('${type=node.type}', opts);
      let ast = parser.parse();
      let fn = ast.compile();
      assert.equal(fn(), 'formula');

      let parser2 = new Parser('${total=2 * 7}', opts);
      let ast2 = parser2.parse();
      let fn2 = ast2.compile();
      assert.equal(fn2(), '14');
      assert.equal(parser2.variables.get('total'), '14');
    });
  });
});
