'use strict';

require('mocha');
const assert = require('assert').strict;
const { parse } = require('../lib/Parser');

const choices = (input, fn) => {
  const ast = parse(input);
  const node = fn ? fn(ast) : ast.nodes[0];
  return node.choices;
};

describe('choices', () => {
  describe('parse', () => {
    it('should parse placeholder choices', () => {
      assert.deepEqual(choices('${1|one,two,three|}'), ['one', 'two', 'three']);
      assert.deepEqual(choices('${1|one,  two,    three|}'), ['one', '  two', '    three']);
    });

    it('should parse nested placeholder choices', () => {
      const find = ast => ast.find('choices');
      assert.deepEqual(choices('${FOO:${1|one,two,three|}}', find), ['one', 'two', 'three']);
    });

    it('should ignore snippets that do not start with an integer', () => {
      assert.deepEqual(choices('${TM_FILENAME|one,two,three|}'), void 0);
    });

    it('should ignore escaped templates', () => {
      assert.deepEqual(choices('\\${1|one,two,three|}'), void 0);
    });

    it('should ignore escaped pipes and commas', () => {
      assert.deepEqual(choices('${1|one\\,  two,    three|}'), ['one\\,  two', '    three']);
      assert.deepEqual(choices('${1|one\\,  two \\| three|}'), ['one\\,  two \\| three']);
    });

    it('should parse choices with escaped special characters', () => {
      assert.deepEqual(choices('${1|\\,,},$,\\|,\\\\|}'), ['\\,', '}', '$', '\\|', '\\\\']);
    });

    it('should ignore choices when first pipe is escaped', () => {
      assert.deepEqual(choices('${1\\|foo,bar,baz|}'), undefined);
    });

    it('should ignore choices when last pipe is escaped', () => {
      assert.deepEqual(choices('${1|foo,bar,baz\\|}'), undefined);
    });
  });

  describe('stringify', () => {
    const stringify = input => {
      return parse(input).stringify() === input;
    };

    it('should stringify choices', () => {
      assert(stringify('${TM_FILENAME|one,two,three|}'));
      assert(stringify('${1|one,two,three|}'));
      assert(stringify('\\${1|one,two,three|}'));
      assert(stringify('${1|one,  two,    three|}'));
      assert(stringify('${1|one\\,  two,    three|}'));
      assert(stringify('${1|one\\,  two \\| three|}'));
      assert(stringify('${1|\\,,},$,\\|,\\\\|}'));
    });
  });

  describe('transforms', () => {
    it('should work with transforms', () => {
      const input = [
        'placeholder thing ${1:this}',
        'choice thing ${2|this,that,other|}',
        'transform placeholder ${1/(this)|(that)|(other)/${1:+1}${2:+2}${3:+3}/}',
        'transform placeholder ${2/(this)|(that)|(other)/${1:+1}${2:+2}${3:+3}/}',
        '$0'
      ].join('\n');

      const stops = new Map();
      const ast = parse(input, { stops });
      const node = ast.find('choices');
      const fn = ast.compile();
      const nfn = node.compile();

      stops.set(1, 'that');

      assert.equal(fn(), [
        'placeholder thing that',
        'choice thing this',
        'transform placeholder 2',
        'transform placeholder 1',
        ''
      ].join('\n'));

      stops.set(0, 'AFTER');

      assert.equal(fn(), [
        'placeholder thing that',
        'choice thing this',
        'transform placeholder 2',
        'transform placeholder 1',
        'AFTER'
      ].join('\n'));

      stops.set(1, 'other');

      assert.equal(fn(), [
        'placeholder thing other',
        'choice thing this',
        'transform placeholder 3',
        'transform placeholder 1',
        'AFTER'
      ].join('\n'));

      node.choose(0);
      assert.equal(nfn(), 'this');

      node.choose(1);
      assert.equal(nfn(), 'that');

      node.choose(2);
      assert.equal(nfn(), 'other');

      node.choose(3);
      assert.equal(nfn(), '');
    });
  });
});
