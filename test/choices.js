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

    it('should support variable choices', () => {
      assert.deepEqual(choices('${TM_FILENAME|one,two,three|}'), ['one', 'two', 'three']);
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

  describe('choices variables', () => {
    it('should support variables as choices', () => {
      const data = {};
      const ast = parse('Choice: ${1|${foo:${home}},$array,$user|}', { data });
      const node = ast.find('choices');
      const fn = ast.compile();

      assert.equal(fn(), 'Choice: home');
      node.choose(1);
      assert.equal(fn(), 'Choice: array');
      node.choose(2);
      assert.equal(fn(), 'Choice: user');

      node.choose(0);
      data.home = '~/foo';
      assert.equal(fn(), 'Choice: ~/foo');

      node.choose(1);
      data.array = ['alpha', 'beta', 'gamma'];
      data.user = 'someuser';
      assert.equal(fn(), 'Choice: alpha');

      node.choose(3);
      assert.equal(fn(), 'Choice: gamma');

      node.choose(4);
      assert.equal(fn(), 'Choice: someuser');
    });

    it('should support functions as variables', () => {
      const ast = parse('Choice: ${1|${foo:${nested}},$array,$user|}');
      const node = ast.find('choices');
      const fn = ast.compile();

      assert.equal(fn({ foo: () => 'abc' }), 'Choice: abc');
      assert.equal(fn({ foo: () => 'def' }), 'Choice: def');
      assert.equal(fn({ foo: () => 'ghi' }), 'Choice: ghi');
    });

    it('should support nested variables in choices', () => {
      const ast = parse('Choice: ${3|${foo:${path:${home}}},${array},$user|}');
      const node = ast.find('choices');
      const data = {
        home: '~/someuser',
        user: process.env.USER,
        files: () => ['a', 'b', 'c'],
        array() {
          return ['one', 'two', 'three'];
        }
      };

      const fn = ast.compile();
      assert.equal(fn(data), 'Choice: ~/someuser');
    });

    it('should support dynamically adding choices from nested variables', () => {
      const ast = parse('Choice: ${1|${files},foo|}');
      const node = ast.find('choices');
      const fn = ast.compile();
      assert.equal(fn({ files: () => ['a', 'b', 'c'] }), 'Choice: a');
    });

    it('should support dynamically adding choices from nested variables #2', () => {
      const ast = parse('Choice: ${1|foo,${files}|}');
      const node = ast.find('choices');
      const fn = ast.compile();
      assert.equal(fn({ files: () => ['a', 'b', 'c'] }), 'Choice: foo');
    });

    it('should allow choices to be added from nested variables', () => {
      const ast = parse('Choice: ${3|${foo:${bar:${files}}},${array},$user|}');
      const node = ast.find('choices');
      const data = {
        home: '~/someuser',
        user: process.env.USER,
        files: () => ['a', 'b', 'c'],
        array() {
          return ['one', 'two', 'three'];
        }
      };

      const fn = ast.compile();
      assert.equal(fn(data), 'Choice: a');
    });

    it('should support functions on nested variables', () => {
      const ast = parse('Choice: ${1|${foo:${nested}},$array,$user|}');
      const node = ast.find('choices');
      const fn = ast.compile();

      assert.equal(fn({ foo: () => 'abc' }), 'Choice: abc');
      assert.equal(fn({ nested: () => 'inner' }), 'Choice: inner');
    });

    it('should not overwrite parent values with nested values', () => {
      const ast = parse('Choice: ${1|${foo:${nested}}|}');
      const node = ast.find('choices');
      const fn = ast.compile();

      assert.equal(fn({ foo: () => 'abc' }), 'Choice: abc');
      assert.equal(fn({ nested: () => 'inner' }), 'Choice: inner');
      assert.equal(fn({ foo: () => 'xyz' }), 'Choice: xyz');
    });

    it('should support functions that return array values', () => {
      const ast = parse('Choice: ${1|${foo:${nested}},$array,$user|}');
      const node = ast.find('choices');
      const fn = ast.compile();

      node.choose(1);
      assert.equal(fn({ array: () => ['a', 'b', 'c'] }), 'Choice: a');

      node.choose(3);
      assert.equal(fn(), 'Choice: c');
    });

    it('should support non-string values with nested variables', () => {
      const ast = parse('Choice: ${1|${foo:${array}}|}');
      const node = ast.find('choices');
      const fn = ast.compile();

      assert.equal(fn({ array: () => ['a', 'b', 'c'] }), 'Choice: a');
    });

    it('should mirror choices on previous tabstops', () => {
      const input = 'Choose something: ${1:$2} ${2|Foo,Bar,Baz|}';
      const ast = parse(input);
      const node = ast.find('choices');
      const fn = ast.compile();

      assert.equal(fn(), 'Choose something: Foo Foo');
    });

    it('should mirror nested choices on previous tabstops', () => {
      const input = 'Choose something: ${1:$3} ${2:${3|Foo,Bar,Baz|}}';
      const ast = parse(input);
      const node = ast.find('choices');
      const fn = ast.compile();

      assert.equal(fn(), 'Choose something: Foo Foo');
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

      const tabstop = new Map();
      const ast = parse(input, { tabstop });
      const node = ast.find('choices');
      const fn = ast.compile();
      const nfn = node.compile();

      tabstop.set(1, 'that');

      assert.equal(fn(), [
        'placeholder thing that',
        'choice thing this',
        'transform placeholder 2',
        'transform placeholder 1',
        ''
      ].join('\n'));

      tabstop.set(0, 'AFTER');
      node.choose(1);

      assert.equal(fn(), [
        'placeholder thing that',
        'choice thing that',
        'transform placeholder 2',
        'transform placeholder 2',
        'AFTER'
      ].join('\n'));

      tabstop.set(1, 'other');
      node.choose(2);

      assert.equal(fn(), [
        'placeholder thing other',
        'choice thing other',
        'transform placeholder 3',
        'transform placeholder 3',
        'AFTER'
      ].join('\n'));

      tabstop.set(1, 'other');
      node.choose(0);

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
