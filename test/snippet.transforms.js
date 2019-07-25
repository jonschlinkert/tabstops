'use strict';

require('mocha');
const path = require('path');
const assert = require('assert').strict;
const { parse, render } = require('../lib/Parser');
const data = {
  TM_DIRECTORY: __dirname,
  TM_FILENAME: 'parse.js',
  TM_FILEPATH: path.join(__dirname, 'parse.js')
};

const transforms = type => {
  return (input, options) => {
    return parse(input, options).find(type);
  };
};

const params = node => {
 return omit(node.params, ['replacers']);
};

const omit = (node, keys = []) => {
  let obj = {};
  for (let key of Object.keys(node)) {
    if (!keys.includes(key)) {
      obj[key] = node[key];
    }
  }
  return obj;
};

const pick = (node, keys = []) => {
  let obj = {};
  for (let key of keys) {
    if (node[key] !== void 0) {
      obj[key] = node[key];
    }
  }
  return obj;
};

describe('transforms', () => {
  describe('tabstop_transform - parse', () => {
    const transform = transforms('tabstop_transform');

    it('should parse placeholder transforms', () => {
      const input = 'Foo ${1/./=/} Bar';
      const node = transform(input);
      assert.equal(input.slice(...node.loc.range), '${1/./=/}');
      assert.equal(node.stringify(), '${1/./=/}');
      assert.equal(node.inner(), '1/./=/');
    });

    it('should parse placeholder transforms with embedded regex characters', () => {
      const input = 'Foo ${1/[${1:.}/]/=/} Bar';
      const node = transform(input);
      assert.equal(input.slice(...node.loc.range), '${1/[${1:.}/]/=/}');
      assert.equal(node.stringify(), '${1/[${1:.}/]/=/}');
      assert.equal(node.inner(), '1/[${1:.}/]/=/');
    });

    it('should parse placeholder transforms with regex flags', () => {
      const input = 'Foo ${1/./=/gim} Bar';
      const node = transform(input);
      assert.equal(node.type, 'tabstop_transform');
      assert.equal(input.slice(...node.loc.range), '${1/./=/gim}');
      assert.equal(node.stringify(), '${1/./=/gim}');
      assert.equal(node.inner(), '1/./=/gim');
    });

    it('should parse format variable', () => {
      const input = 'Foo ${1/(.)/${1}/g} Bar';
      const node = transform(input);

      assert.equal(node.type, 'tabstop_transform');
      assert.equal(input.slice(...node.loc.range), '${1/(.)/${1}/g}');
      assert.equal(node.stringify(), '${1/(.)/${1}/g}');
      assert.equal(node.inner(), '1/(.)/${1}/g');
    });

    it('should use placeholder values', () => {
      const input = 'errorContext: `${1:err}`, error:${1/err/ok/}';
      assert.equal(render(input), 'errorContext: `err`, error:ok');
    });

    it('should parse format variable', () => {
      assert.deepEqual(params(transform('Foo ${1/(.)/${1}/g} Bar')), {
        type: 'tabstop_transform',
        varname: '1',
        regex: /(.)/g,
        format: '${1}',
        source: '(.)',
        string: '${1/(.)/${1}/g}',
        flags: 'g',
      });

      assert.deepEqual(params(transform('Foo ${1/(.)/${1:upcase}/g} Bar')), {
        type: 'tabstop_transform',
        string: '${1/(.)/${1:upcase}/g}',
        varname: '1',
        regex: /(.)/g,
        format: '${1:upcase}',
        source: '(.)',
        flags: 'g'
      });
    });
  });

  describe('variable_transform - .transform()', () => {
    const transform = transforms('variable_transform');

    it('should transform input using transform formats', () => {
      const input = 'name=${TM_FILENAME/(.*)\\..+$/$1/}';
      assert.equal(render(input), 'name=');
      assert.equal(render(input, { TM_FILENAME: 'text.txt' }), 'name=text');
    });

    it('should transform input using transform formats', () => {
      const input = '${TM_FILENAME/^(.)|-(.)|(\\.js)/${1:/upcase}${2:/upcase}/g}';
      const node = transform(input);
      const params = node.parse();
      assert.equal(node.transform('this-is-a-filename'), 'ThisIsAFilename');
      assert.equal(node.transform('this-is-a-file.js'), 'ThisIsAFile');
    });

    it('should transform input using transform formats - #2', () => {
      const input = '${TM_FILENAME/^(.)|(?:-(.))|(\\.js)/${1:/upcase}-${2:/upcase}/g}';
      const node = transform(input);
      assert.equal(node.transform('this-is-a-filename'), 'T-his-Is-A-Filename');
      assert.equal(node.transform('this-is-a-file.js'), 'T-his-Is-A-File-');
    });

    it('should transform input using transform formats - #3', () => {
      const input = '${foobarfoobar/(foo)/${2:+FAR}/g}';
      const node = transform(input);
      assert.equal(node.transform('foobarfoobar'), 'barbar');
    });

    it('should transform input using transform formats - #4', () => {
      const input = '${ThisIsAVar/([A-Z]).*(Var)/$2-${1:/downcase}/}';
      const node = transform(input);
      const params = node.parse();

      assert.equal(node.transform('ThisIsAVar'), 'Var-t');
    });

    it('should transform input using transform formats - #5', () => {
      const input = 'export default class ${TM_FILENAME/(\\w+)\\.js/$1/g}';
      const node = transform(input);
      const params = node.parse();
      assert.equal(node.transform('FooFile.js'), 'FooFile');
    });

    it('should transform input using transform formats - #6', () => {
      const input = '${ThisIsAVar/([A-Z]).*(Var)/$2-${1:/downcase}/}';
      const node = transform(input);
      assert.equal(node.transform('ThisIsAVar'), 'Var-t');
      assert.equal(node.transform('FOOOOOO'), '');
    });

    it('should transform input using transform formats - #7', () => {
      const input = '${TM_FILENAME/([A-Z_]+)/${1:/downcase}/}';
      const node = transform(input);
      assert.equal(node.transform('TM_FILENAME'), 'tm_filename');
      assert.equal(node.transform('foo'), '');
    });

    it('should transform input using transform formats - #8', () => {
      const input = '${TM_LINE_NUMBER/(10)/${1:?It is:It is not}/} line 10';
      const node = transform(input);
      assert.equal(node.transform(10), 'It is');
      assert.equal(node.transform('TM_LINE_NUMBER'), 'It is not');
      assert.equal(node.transform('foo'), 'It is not');
    });
  });

  describe('variable transforms', () => {
    const fixtures = [
      { input: '${foo/([A-Z][a-z])/format/}', expected: '' },
      { input: '${foo///}', expected: '' },
      { input: '${foo/regex/format/gmi}', expected: '' },
      { input: '${TM_DIRECTORY/.*[\\/](.*)$/$1/}', expected: 'test' },
      { input: '${TM_FILENAME/(.*)/$1/i}', expected: 'parse.js' },
      { input: '${TM_FILENAME/(.*)/$1/i}', expected: 'parse.js' },
      { input: '${TM_FILENAME/(.*)/${1}/i}', expected: 'parse.js' },
      { input: '${TM_FILENAME/(.*)/${1}/i}', expected: 'parse.js' },
      { input: '${TM_FILENAME/(.*)/complex${1:+if}/i}', expected: 'complexif' },
      { input: '${TM_FILENAME/(.*)/complex${1:-else}/i}', expected: 'complexparse.js' },
      { input: '${TM_FILENAME/(.*)/complex${1:/upcase}/i}', expected: 'complexPARSE.JS' },
      { input: '${TM_FILENAME/(.*)/complex${1:?if:else}/i}', expected: 'complexif' },
      { input: '${TM_FILENAME/(.*)/complex${1:else}/i}', expected: 'complexparse.js' },
      { input: '${TM_FILENAME/(.*)/This-$1-encloses/i}', expected: 'This-parse.js-encloses' },
      { input: '${TM_FILENAME/.*/${0:fooo}/i}', expected: 'parse.js' },
      { input: '${TM_FILENAME/^(.*)\\..+$/${1:+}/}', expected: 'parse' },
      { input: '${TM_FILENAME/b.*/${0:xyz}/i}', expected: 'xyz' },
      {
        it: 'should return entire string when regex is invalid',
        input: '${foo/([A-Z][a-z])/format/GMI}',
        expected: '${foo/([A-Z][a-z])/format/GMI}'
      },
      {
        it: 'should return entire string when regex is invalid',
        input: '${foo/([A-Z][a-z])/format/funky}',
        expected: '${foo/([A-Z][a-z])/format/funky}'
      },
      {
        it: 'should return entire string when regex is invalid',
        input: '${foo/([A-Z][a-z]/format/}',
        expected: '${foo/([A-Z][a-z]/format/}'
      },
      { input: '${foo/m\\/atch/$1/i}', expected: '' },
      { input: '${foo/regex\\/format/options}', expected: '' },
      {
        it: 'should not choke on incomplete expressions',
        input: '${foo///',
        expected: '${foo///'
      },
      {
        it: 'should not choke on incomplete expressions',
        input: '${foo/regex/format/options',
        expected: '${foo/regex/format/options'
      }
    ];

    for (let fixture of fixtures) {
      it(fixture.it || 'should parse ' + fixture.input, () => {
        assert.equal(render(fixture.input, data), fixture.expected);
      });
    }

    it('should respect escaped forward slashes in transform regex', () => {
      assert.equal(render('${TM_DIRECTORY/test[\\\\/]/$1/}', data), '');
      assert.equal(render('${TM_FILEPATH/.*[\\\\/]test[\\\\/](.*)$/$1/}', data), 'parse.js');
    });

    it('should respect escaped forward slashes in tranform format string', () => {
      assert.equal(render('${TM_FILENAME/a/\\/$1/g}', data), 'p\\/rse.js');
      assert.equal(render('${TM_FILENAME/a/in\\/$1ner/g}', data), 'pin\\/nerrse.js');
      assert.equal(render('${TM_FILENAME/a/end\\//g}', data), 'pend\\/rse.js');
      assert.equal(render('${TM_FILENAME/(a)/\\/$1/g}', data), 'p\\/arse.js');
      assert.equal(render('${TM_FILENAME/(a)/in\\/$1ner/g}', data), 'pin\\/anerrse.js');
      assert.equal(render('${TM_FILENAME/(a)/end\\//g}', data), 'pend\\/rse.js');
    });
  });

  describe('ported from vscode tests', () => {
    it('should return an empty string if the variable is undefined', () => {
      assert.equal(render('${UNDEFINED_VAR/^(.*)\\..+$/$0/}', data), '');
    });

    it('should return the entire match when $0 is used', () => {
      assert.equal(render('${TM_FILENAME/^(.*)\\..+$/$0/}', data), 'parse.js');
      assert.equal(render('${TM_FILENAME/^(.*)\\..+$/$0$0/}', data), 'parse.jsparse.js');
      assert.equal(render('${TM_FILENAME/^(.*)\\..+$/${0}$0/}', data), 'parse.jsparse.js');
      assert.equal(render('${TM_FILENAME/^(.*)\\..+$/${0}${0}/}', data), 'parse.jsparse.js');
    });

    it('should return the specified match group', () => {
      assert.equal(render('${TM_FILENAME/^(.*)\\.(.+)$/$1/}', data), 'parse');
      assert.equal(render('${TM_FILENAME/^(.*)\\.(.+)$/${1}/}', data), 'parse');
      assert.equal(render('${TM_FILENAME/^(.*)\\.(.+)$/$2/}', data), 'js');
      assert.equal(render('${TM_FILENAME/^(.*)\\.(.+)$/${2}/}', data), 'js');
      assert.equal(render('${TM_FILENAME/^(.*)\\.(.+)$/$2-$1/}', data), 'js-parse');
      assert.equal(render('${TM_FILENAME/^(.*)\\.(.+)$/${2}-$1/}', data), 'js-parse');
      assert.equal(render('${TM_FILENAME/^(.*)\\.(.+)$/${2}-${1}/}', data), 'js-parse');
    });
  });

  describe('helpers', () => {
    it('should apply helpers to matches', () => {
      assert.equal(render('${TM_FILENAME/^(.*)\\..+$/${0:/upcase}/}', data), 'PARSE.JS');
      assert.equal(render('${TM_FILENAME/^(.*)\\..+$/${1:/upcase}/}', data), 'PARSE');
    });
  });

  describe('custom helpers', () => {
    it('should apply helpers to matches', () => {
      let ctx = { name: 'brian' };
      let opts = {
        helpers: {
          dashed(value) {
            return value.split('').join('-');
          },
          plused(value) {
            return value.split('').join('+');
          },
          alt(value, i) {
            return i % 2 === 0 ? value.toUpperCase() : value.toLowerCase();
          }
        }
      };

      assert.equal(render('${name/(.*)/${0:/dashed}/}', ctx, opts), 'b-r-i-a-n');
      assert.equal(render('${name/(.*)/${1:/plused}/}', ctx, opts), 'b+r+i+a+n');
      assert.equal(render('${name/(.)/${1:/alt}/g}', ctx, opts), 'BrIaN');
    });
  });
});
