'use strict';

require('mocha');
const assert = require('assert').strict;
const { parse, compile } = require('../lib/Parser');
let tabstop;

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
      let data = { TM_SELECTED_TEXT: '', far: '' };
      assert.equal(compile('$far boo')(), 'far boo');
      assert.equal(compile('$far boo')(data), 'far boo');
      assert.equal(compile('$far-boo')(), 'far-boo');
      assert.equal(compile('\\$far-boo')(), '\\$far-boo');
      assert.equal(compile('far$farboo')(), 'farfarboo');
      assert.equal(compile('far${farboo}')(), 'farfarboo');
      assert.equal(compile('$123')(), '');
      assert.equal(compile('$farboo')(), 'farboo');
      assert.equal(compile('$far12boo')(), 'far12boo');
      assert.equal(compile('000_${far}_000')(), '000_far_000');
      assert.equal(compile('FFF_${TM_SELECTED_TEXT}_FFF$0')(), 'FFF_TM_SELECTED_TEXT_FFF');
      assert.equal(compile('FFF_${TM_SELECTED_TEXT}_FFF$0')(data), 'FFF_TM_SELECTED_TEXT_FFF');
    });
  });

  describe('invalid', () => {
    it('should handle invalid expressions', () => {
      assert.equal(compile('foo ${name bar')(), 'foo ${name bar');
      assert.equal(compile('${name')(), '${name');
    });
  });

  describe('variables', () => {
    it('should return the variable name when no values are defined', () => {
      assert.equal(compile('foo ${name} bar')(), 'foo name bar');
      assert.equal(compile('foo $name bar')(), 'foo name bar');
      assert.equal(compile('${name}')(), 'name');
      assert.equal(compile('$name')(), 'name');
    });

    it('should support dots in variables', () => {
      let opts = { dotVariables: true };
      assert.equal(compile('${first.name}', opts)(), 'first.name');
      assert.equal(compile('$first.name', opts)(), 'first.name');
      assert.equal(compile('foo ${first.name} bar', opts)(), 'foo first.name bar');
      assert.equal(compile('foo $first.name bar', opts)(), 'foo first.name bar');
    });

    it('should not support leading or trailing dots in variables', () => {
      let opts = { dotVariables: true };
      assert.equal(compile('$name.', opts)(), 'name.');
      assert.equal(compile('Name: $name.')({ name: 'Brian' }), 'Name: Brian.');
      assert.equal(compile('$.name', opts)(), '$.name');
      assert.equal(compile('$.name.', opts)(), '$.name.');
      assert.equal(compile('foo $.name bar', opts)(), 'foo $.name bar');
      assert.equal(compile('foo $name. bar', opts)(), 'foo name. bar');
      assert.equal(compile('Name: $name. ...', opts)({ name: 'Brian' }), 'Name: Brian. ...');
    });

    it('should resolve nested variables', () => {
      let opts = { dotVariables: true };
      let data = { first: { name: 'Brian' } };

      assert.equal(compile('${first.name}', opts)(data), 'Brian');
      assert.equal(compile('$first.name', opts)(data), 'Brian');
      assert.equal(compile('foo ${first.name} bar', opts)(data), 'foo Brian bar');
      assert.equal(compile('foo $first.name bar', opts)(data), 'foo Brian bar');
    });

    it('should not resolve nested variables when dotVariables is disabled', () => {
      let opts = { dotVariables: false };
      let data = { first: { name: 'Brian' } };

      assert.equal(compile('${first.name}', opts)(data), '${first.name}');
      assert.equal(compile('foo ${first.name} bar', opts)(data), 'foo ${first.name} bar');
      assert.equal(compile('foo $first.name bar', opts)(data), 'foo [object Object].name bar');
      assert.equal(compile('$first.name', opts)(data), '[object Object].name');
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
      tabstop = new Map();
    });

    it('should render a tabstop using a value from the context', () => {
      tabstop.set(1, 'OneTwo');
      assert.equal(compile('${1}', { tabstop })(), 'OneTwo');
    });

    it('should return an empty string when no values are defined', () => {
      assert.equal(compile('${1}', { tabstop })(), '');
    });
  });

  describe('tabstops with placeholders', () => {
    beforeEach(() => {
      tabstop = new Map();
    });

    it('should render a tabstop using a value from the context', () => {
      assert.equal(compile('${1:${name}}', { tabstop })({ name: 'FooBar' }), 'FooBar');
    });

    it('should render a tabstop using its placeholder value', () => {
      assert.equal(compile('${1:AbcXyz}', { tabstop })(), 'AbcXyz');
    });

    it('should return the tabstop name when no values are defined', () => {
      assert.equal(compile('${1}', { tabstop })(), '');
    });
  });
});
