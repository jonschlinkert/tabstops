'use strict';

require('mocha');
const assert = require('assert').strict;
const Snippet = require('../lib/Snippet');
const parse = input => {
  const snippet = new Snippet(input);
  return snippet.parse();
};

const render = (input, data) => {
  const snippet = new Snippet(input);
  const ast = snippet.parse();
  const fn = ast.compile();
  const result = fn(data);
  console.log([input, result]);
  return result;
};

const cleanup = node => {
  node.range = node.loc.range;
  delete node.params;
  delete node.tabstops;
  delete node.source;
};

const transforms = type => {
  return (input, options) => {
    return parse(input, options).find(type);
  };
};

describe('transforms', () => {
  describe('placeholder_transform - parse', () => {
    const transform = transforms('placeholder_transform');

    it('should parse placeholder transforms', () => {
      const input = 'Foo ${1/./=/} Bar';
      const node = transform(input);
      assert.equal(input.slice(...node.loc.range), '${1/./=/}');
      assert.equal(node.outer(), '${1/./=/}');
      assert.equal(node.inner(), '1/./=/');
    });

    it('should parse placeholder transforms with embedded regex characters', () => {
      const input = 'Foo ${1/[${1:.}/]/=/} Bar';
      const node = transform(input);
      assert.equal(input.slice(...node.loc.range), '${1/[${1:.}/]/=/}');
      assert.equal(node.outer(), '${1/[${1:.}/]/=/}');
      assert.equal(node.inner(), '1/[${1:.}/]/=/');
    });

    it('should parse placeholder transforms with regex flags', () => {
      const input = 'Foo ${1/./=/gim} Bar';
      const node = transform(input);
      assert.equal(node.type, 'placeholder_transform');
      assert.equal(input.slice(...node.loc.range), '${1/./=/gim}');
      assert.equal(node.outer(), '${1/./=/gim}');
      assert.equal(node.inner(), '1/./=/gim');
    });

    it('should parse format variable', () => {
      const input = 'Foo ${1/(.)/${1}/g} Bar';
      const node = transform(input);

      assert.equal(node.type, 'placeholder_transform');
      assert.equal(input.slice(...node.loc.range), '${1/(.)/${1}/g}');
      assert.equal(node.outer(), '${1/(.)/${1}/g}');
      assert.equal(node.inner(), '1/(.)/${1}/g');
    });

    it('should parse format variable', () => {
      assert.deepEqual(transform('Foo ${1/(.)/${1}/g} Bar'), {
        type: 'placeholder_transform',
        value: '1/(.)/${1}/g',
        varname: '1',
        regex: /(.)/g,
        format: '${1}',
        flags: 'g',
        nodes: [
          {
            type: 'tabstop',
            open: '${',
            close: '}',
            line: 1,
            number: 1
          }
        ]
      });

      assert.deepEqual(transform('Foo ${1/(.)/${1:upcase}/g} Bar'), {
        type: 'placeholder_transform',
        value: '1/(.)/${1:upcase}/g',
        varname: '1',
        regex: /(.)/g,
        format: '${1:upcase}',
        flags: 'g',
        nodes: [
          {
            number: 1,
            line: 1,
            placeholder: 'upcase',
            type: 'tabstop',
            open: '${',
            close: '}'
          }
        ]
      });
    });
  });

  describe('variable_transform - .transform()', () => {
    const transform = transforms('variable_transform');

    it.only('should transform input using transform formats', () => {
      const input = 'name=${TM_FILENAME/(.*)\\..+$/$1/}';
      assert.equal(render(input), 'name=');
      assert.equal(render(input, { TM_FILENAME: 'text.txt' }), 'name=');
    });

    // it('should transform input using transform formats', () => {
    //   const input = '${TM_FILENAME/^(.)|(?:-(.))|(\\.js)/${1:/upcase}${2:/upcase}/g}';
    //   const node = transform(input);
    //   const params = node.parse();

    //   assert.equal(params.replace('this-is-a-filename'), 'ThisIsAFilename');
    //   assert.equal(params.replace('this-is-a-file.js'), 'ThisIsAFile');
    // });

    // it('should transform input using transform formats - #2', () => {
    //   const input = '${TM_FILENAME/^(.)|(?:-(.))|(\\.js)/${1:/upcase}-${2:/upcase}/g}';
    //   const node = transform(input);
    //   const params = node.parse();

    //   assert.equal(params.replace('this-is-a-filename'), 'T-his-Is-A-Filename');
    //   assert.equal(params.replace('this-is-a-file.js'), 'T-his-Is-A-File-');
    // });

    // it('should transform input using transform formats - #3', () => {
    //   const input = '${foobarfoobar/(foo)/${2:+FAR}/g}';
    //   const node = transform(input);
    //   const params = node.parse();

    //   assert.equal(params.replace('foobarfoobar'), 'barbar');
    // });

    // it('should transform input using transform formats - #4', () => {
    //   const input = '${ThisIsAVar/([A-Z]).*(Var)/$2-${1:/downcase}/}';
    //   const node = transform(input);
    //   const params = node.parse();

    //   assert.equal(params.replace('ThisIsAVar'), 'Var-t');
    // });

    // it('should transform input using transform formats - #5', () => {
    //   const input = 'export default class ${TM_FILENAME/(\\w+)\\.js/$1/g}';
    //   const node = transform(input);
    //   const params = node.parse();
    //   assert.equal(params.replace('FooFile.js'), 'FooFile');
    // });

    // it('should transform input using transform formats - #6', () => {
    //   const input = '${ThisIsAVar/([A-Z]).*(Var)/$2-${1:/downcase}/}';
    //   const node = transform(input);
    //   const params = node.parse();
    //   // console.log(params)
    //   // assert.equal(params.replace('ThisIsAVar'), 'Var-t');
    //   // assert.equal(params.replace('FOOOOOO'), '');
    // });

    // it('should transform input using transform formats - #7', () => {
    //   const input = '${TM_FILENAME/([A-Z_]+)/${1:/downcase}/}';
    //   const node = transform(input);
    //   const params = node.parse();
    //   assert.equal(params.replace('TM_FILENAME'), 'tm_filename');
    //   assert.equal(params.replace('foo'), '');
    // });

    // it.skip('should transform input using transform formats - #8', () => {
    //   const input = '${TM_LINE_NUMBER/(10)/${1:?It is:It is not}/} line 10';
    //   const ast = parse(input);
    //   const fn = ast.compile();
    //   console.log(fn({ TM_LINE_NUMBER: 10 }))
    //   // assert.equal(params.replace('TM_LINE_NUMBER'), 'TM_LINE_NUMBER');
    //   // assert.equal(params.replace('foo'), '');
    // });
  });
});
