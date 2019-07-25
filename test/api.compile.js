'use strict';

require('mocha');
const assert = require('assert').strict;
const { parse, compile } = require('../lib/Parser');
let tabstops;

describe('compile', () => {
  describe('from vscode', () => {
    it('TM Snippets', () => {
      assert.equal(compile('foo${1:bar}}')(), 'foobar}');
      assert.equal(compile('foo${1:bar}${2:foo}}')(), 'foobarfoo}');
      assert.equal(compile('foo${1:bar\\}${2:foo}}')(), 'foobar\\}foo');
    });

    it('TM Snippets - should unescape', () => {
      const ast = parse('foo${1:bar\\}${2:foo}}', { unescape: true });
      assert.equal(ast.compile()(), 'foobar}foo');
    });

    it('Parser, placeholder', () => {
      assert.equal(compile('farboo')(), 'farboo');
      assert.equal(compile('far{{}}boo')(), 'far{{}}boo');
      assert.equal(compile('far{{123}}boo')(), 'far{{123}}boo');
      assert.equal(compile('far\\{{123}}boo')(), 'far\\{{123}}boo');
    });

    it('Parser, literal code', () => {
      assert.equal(compile('far`123`boo')(), 'far`123`boo');
      assert.equal(compile('far\\`123\\`boo')(), 'far\\`123\\`boo');
    });

    it('Parser, variables/tabstop', () => {
      let data = { TM_SELECTED_TEXT: '' };
      assert.equal(compile('$far boo')(), 'far boo');
      assert.equal(compile('$far boo')({ far: '' }), ' boo');
      assert.equal(compile('$far-boo')(), 'far-boo');
      assert.equal(compile('\\$far-boo')(), '\\$far-boo');
      assert.equal(compile('far$farboo')(), 'farfarboo');
      assert.equal(compile('far${farboo}')(), 'farfarboo');
      assert.equal(compile('$123')(), '');
      assert.equal(compile('$farboo')(), 'farboo');
      assert.equal(compile('$far12boo')(), 'far12boo');
      assert.equal(compile('000_${far}_000')(), '000_far_000');
      assert.equal(compile('FFF_${TM_SELECTED_TEXT}_FFF$0')(), 'FFF_TM_SELECTED_TEXT_FFF');
      assert.equal(compile('FFF_${TM_SELECTED_TEXT}_FFF$0')(data), 'FFF__FFF');
    });
  });

  describe('variables', () => {
    it('should return the variable name when no values are defined', () => {
      assert.equal(compile('foo ${name} bar')(), 'foo name bar');
      assert.equal(compile('foo $name bar')(), 'foo name bar');
      assert.equal(compile('${name}')(), 'name');
      assert.equal(compile('$name')(), 'name');
    });

    it('should render a variable using a value from the context', () => {
      assert.equal(compile('foo ${name} bar')({ name: 'OneTwo' }), 'foo OneTwo bar');
      assert.equal(compile('foo $name bar')({ name: 'OneTwo' }), 'foo OneTwo bar');
      assert.equal(compile('${name}')({ name: 'OneTwo' }), 'OneTwo');
      assert.equal(compile('$name')({ name: 'OneTwo' }), 'OneTwo');
    });
  });

  describe('variables with placeholders', () => {
    it('should render a variable using a value from the context', () => {
      assert.equal(compile('foo ${name:AbcXyz} bar')({ name: 'OneTwo' }), 'foo OneTwo bar');
      assert.equal(compile('foo ${name:AbcXyz} bar')({ name: 'OneTwo' }), 'foo OneTwo bar');
    });

    it('should render a variable using its placeholder value', () => {
      assert.equal(compile('${name:AbcXyz}')(), 'AbcXyz');
      assert.equal(compile('foo ${name:AbcXyz} bar')(), 'foo AbcXyz bar');
    });
  });

  describe('nested variables', () => {
    it('should render a nested variable using a value from the context', () => {
      assert.equal(compile('${name:${FOO_BAR}}')({ FOO_BAR: 'OneTwo' }), 'OneTwo');
      assert.equal(compile('${name:$FOO_BAR}')({ FOO_BAR: 'OneTwo' }), 'OneTwo');
    });

    it('should render the placeholder value of a nested variable', () => {
      assert.equal(compile('${name:${FOO_BAR:default}}')(), 'default');
    });

    it('should render deeply nested variables', () => {
      assert.equal(compile('${name:${one:${two:${three}}}}')({ three: 'It Worked!' }), 'It Worked!');
      assert.equal(compile('${name:${one:${two:${three:default}}}}')(), 'default');
      assert.equal(compile('${name:${one:${two:${three:default}${alpha}}}}')(), 'defaultalpha');
      assert.equal(compile('${name:${one:${two:${three:default}abc${alpha}}}}')(), 'defaultabcalpha');
      assert.equal(compile('${name:${one:${two:${three:default}abc${alpha}}}}')({ alpha: 'BETA'}), 'defaultabcBETA');
      assert.equal(compile('${name:${one:${two:${three:default}abc${alpha}}}}')({ two: 'ZAP'}), 'ZAP');
    });
  });

  describe('tabstops', () => {
    beforeEach(() => {
      tabstops = new Map();
    });

    it('should render a tabstop using a value from the context', () => {
      tabstops.set(1, 'OneTwo');
      assert.equal(compile('${1}', { tabstops })(), 'OneTwo');
    });

    it('should return an empty string when no values are defined', () => {
      assert.equal(compile('${1}', { tabstops })(), '');
    });
  });

  describe('tabstops with placeholders', () => {
    beforeEach(() => {
      tabstops = new Map();
    });

    it('should render a tabstop using a value from the context', () => {
      assert.equal(compile('${1:${name}}', { tabstops })({ name: 'FooBar' }), 'FooBar');
    });

    it('should render a tabstop using its placeholder value', () => {
      assert.equal(compile('${1:AbcXyz}', { tabstops })(), 'AbcXyz');
    });

    it('should return the tabstop name when no values are defined', () => {
      assert.equal(compile('${1}', { tabstops })(), '');
    });
  });
});
