'use strict';

require('mocha');
const assert = require('assert').strict;
const { parse, compile, render } = require('../lib/snippet');
let tabstops;

describe('compile', () => {
  describe('variables', () => {
    it('should return the variable name with no values are defined', () => {
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
    })
  });

  describe.skip('tabstops', () => {
    beforeEach(() => {
      tabstops = new Map();
    });

    it('should render a tabstop using a value from the context', () => {
      tabstops.set(1, 'OneTwo');
      assert.equal(compile('${1}')({ tabstops }), 'OneTwo');
    });

    it('should return the tabstop name with no values are defined', () => {
      assert.equal(compile('${1}')({ tabstops }), 'name');
    });
  });

  describe.skip('tabstops with placeholders', () => {
    beforeEach(() => {
      tabstops = new Map();
    });

    it('should render a tabstop using a value from the context', () => {
      assert.equal(compile('${1:AbcXyz}')({ tabstops }), 'OneTwo');
    });

    it('should render a tabstop using its placeholder value', () => {
      assert.equal(compile('${1:AbcXyz}')({ tabstops }), 'AbcXyz');
    });

    it('should return the tabstop name with no values are defined', () => {
      assert.equal(compile('${1}')({ tabstops }), 'name');
    });
  });
});
