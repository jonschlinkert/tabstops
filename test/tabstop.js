'use strict';

require('mocha');
const assert = require('assert').strict;
const { Parser, compile, parse } = require('../lib/Parser');
const { normalize } = require('../lib/utils');

const inner = input => {
  let ast = parse(input);
  let node = ast.nodes.find(n => n.type !== 'text');
  if (node) {
    return node.inner();
  }
};

describe('tabstops', () => {
  describe('compile - with no tabstops entered', () => {
    const fixtures = [
      ['foo{${1}}bar', 'foo{}bar'],
      ['foo{$1}bar', 'foo{}bar'],
      ['foo ${1} bar', 'foo  bar'],
      ['foo $1 bar', 'foo  bar'],
      ['foo $1 bar}', 'foo  bar}'],
      ['foo $1 bar\\}', 'foo  bar\\}'],
      ['foo $1\\}\nbar\n$BAZ', 'foo \\}\nbar\nBAZ'],

      // should match "\\" when it's the last character in the string
      ['foo $1\\}\nbar\n$BAZ\\', 'foo \\}\nbar\nBAZ\\']
    ];

    for (let fixture of fixtures) {
      it(`should compile: "${normalize(fixture[0])}"`, () => {
        assert.equal(compile(fixture[0])(), fixture[1]);
      });
    }
  });

  describe('compile - with tabstop 1 entered', () => {
    const fixtures = [
      ['foo{${1}}bar', 'foo{ENTERED}bar'],
      ['foo{$1}bar', 'foo{ENTERED}bar'],
      ['foo ${1} bar', 'foo ENTERED bar'],
      ['foo $1 bar', 'foo ENTERED bar'],
      ['foo $1 bar}', 'foo ENTERED bar}'],
      ['foo $1 bar\\}', 'foo ENTERED bar\\}'],
      ['foo $1\\}\nbar\n$BAZ', 'foo ENTERED\\}\nbar\nBAZ'],

      // should match "\\" when it's the last character in the string
      ['foo $1\\}\nbar\n$BAZ\\', 'foo ENTERED\\}\nbar\nBAZ\\']
    ];

    for (let fixture of fixtures) {
      it(`should compile: "${normalize(fixture[0])}" with tabstop 1`, () => {
        let parser = new Parser(fixture[0]);
        let ast = parser.parse();

        parser.stops.set(1, 'ENTERED');

        let fn = ast.compile();
        assert.equal(fn(), fixture[1]);
      });
    }
  });

  describe('inner', () => {
    const fixtures = [
      ['foo{${1}}bar', '1'],
      ['foo{$1}bar', '1'],
      ['foo ${1} bar', '1'],
      ['foo $1 bar', '1'],
      ['foo $1 bar}', '1'],
      ['foo $1 bar\\}', '1'],
      ['foo $1\\}\nbar\n$BAZ', '1'],

      // should match "\\" when it's the last character in the string
      ['foo $1\\}\nbar\n$BAZ\\', '1']
    ];

    for (let fixture of fixtures) {
      it(`should return inner value for: "${normalize(fixture[0])}"`, () => {
        assert.equal(inner(fixture[0]), fixture[1]);
      });
    }
  });

  describe('escaped', () => {
    const fixtures = [
      ['foo \\${1} bar', undefined],
      ['foo ${1\\} bar', undefined],
      ['foo ${1.} bar', undefined],
      ['foo \\$1 bar', undefined]
    ];

    for (let fixture of fixtures) {
      it(`should not match escaped characters: "${normalize(fixture[0])}"`, () => {
        assert.equal(inner(fixture[0]), fixture[1]);
      });
    }
  });
});
