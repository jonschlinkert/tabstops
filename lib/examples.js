'use strict';

const path = require('path');
const parse = require('./parse');

process.env.TM_FILENAME = 'parse.js';
process.env.TM_FILEPATH = path.join(__dirname, 'parse.js');
process.env.TM_DIRECTORY = __dirname;
process.env.TM_SELECTED_TEXT = 'FOOBAR';

const fixtures = [
  {
    it: 'should return an empty string if the variable is undefined',
    input: '${UNDEFINED_VAR/^(.*)\\..+$/$0/}',
    expected: '',
  },
  {
    it: 'should return the entire match when $0 is used',
    units: [
      { input: '${TM_FILENAME/^(.*)\\..+$/$0/}', expected: 'parse.js' },
      { input: '${TM_FILENAME/^(.*)\\..+$/$0$0/}', expected: 'parse.jsparse.js' },
      { input: '${TM_FILENAME/^(.*)\\..+$/${0}$0/}', expected: 'parse.jsparse.js' },
      { input: '${TM_FILENAME/^(.*)\\..+$/${0}${0}/}', expected: 'parse.jsparse.js' },
    ]
  },
  {
    it: 'should return the specified match group',
    units: [
      { input: '${TM_FILENAME/^(.*)\\.(.+)$/$1/}', expected: 'parse' },
      { input: '${TM_FILENAME/^(.*)\\.(.+)$/${1}/}', expected: 'parse' },
      { input: '${TM_FILENAME/^(.*)\\.(.+)$/$2/}', expected: 'js' },
      { input: '${TM_FILENAME/^(.*)\\.(.+)$/${2}/}', expected: 'js' },
      { input: '${TM_FILENAME/^(.*)\\.(.+)$/$2-$1/}', expected: 'js-parse' },
      { input: '${TM_FILENAME/^(.*)\\.(.+)$/${2}-$1/}', expected: 'js-parse' },
      { input: '${TM_FILENAME/^(.*)\\.(.+)$/${2}-${1}/}', expected: 'js-parse' },
    ]
  },
  {
    describe: 'helpers',
    it: 'should apply helpers to the specified match groups',
    units: [
      { input: '${TM_FILENAME/^(.*)\\..+$/${0:/upcase}/}', expected: 'PARSE.JS' },
      { input: '${TM_FILENAME/^(.*)\\..+$/${1:/upcase}/}', expected: 'PARSE' },
    ]
  },
  {
    skip: true,
    input: 'errorContext: `${1:err}`, error:$1',
    tabstops: [{ 1: '' }, { 1: 'foo' }],
    expected: ''
  },
  {
    skip: true,
    input: ['errorContext: `$1`, error:${1:err}'],
    tabstops: [{ 1: '' }, { 1: 'foo' }],
    expected: ''
  },
  {
    describe: 'tabstops',
    units: [
      { input: '$1', method: 'stringify', expected: '$1' },
      { input: '\\$1', method: 'stringify', expected: '\\$1' }
    ]
  },
  {
    describe: 'placeholder transforms',
    units: [
      { input: '${1///}', expected: '' },
      { input: '${1/regex/format/gmi}', expected: '' },
      { input: '${1/([A-Z][a-z])/format/}', expected: '' },
      { input: '${1/(void$)|(.+)/${1:?-\treturn nil;}/}', expected: '' },
    ]
  },
  {
    describe: 'placeholder transforms',
    it: 'should deal with tricky regex',
    units: [
      { input: '${1/m\\/atch/$1/i}', expected: '' },
      { input: '${1/regex\\/format/options}', expected: '' }
    ]
  },
  {
    describe: 'placeholder transforms',
    it: 'should ignore incomplete expressions',
    units: [
      { input: '${1///', expected: '${1///' },
      { input: '${1/regex/format/options', expected: '${1/regex/format/options' }
    ]
  },
  {
    describe: 'placeholder transforms',
    it: 'should ignore incomplete expressions',
    units: [
      {
        input: 'errorContext: `${1:err}`, error:${1/err/ok/}',
        expected: 'errorContext: `err`, error:ok',
        notes: 'This differs from vscode, which expects "errorContext: `err`, error:err". However, we seem be getting the correct result per https://macromates.com/manual/en/snippets#transformations'
      },
      {
        input: 'errorContext: `${1:null}`, error:${1/err/ok/}',
        expected: 'errorContext: `null`, error:'
      },
      {
        input: 'errorContext: `${1}`, error:${1/err/ok/}',
        expected: 'errorContext: ``, error:'
      }
    ]
  },
  {
    describe: 'repeated placeholder transforms',
    it: 'should always inherit values in repeated transforms',
    units: [
      { input: '${1:foo}-abc-$1', expected: 'foo-abc-foo' },
      { input: '${1:foo}-abc-${1}', expected: 'foo-abc-foo' },
      { input: '${1:foo}-abc-${1:bar}', expected: 'foo-abc-foo' },
      { input: '${1}-abc-${1:foo}', expected: 'foo-abc-foo' }
    ]
  },
  {
    describe: 'variable transforms',
    it: 'should respect escaped forward slashes in transform regex',
    units: [
      { input: '${TM_DIRECTORY/lib\\//$1/}', expected: '' },
      { input: '${TM_FILEPATH/lib\\/(.*)$/$1/}', expected: 'parse.js' }
    ]
  },
  {
    describe: 'variable transforms',
    it: 'should respect escaped forward slashes in tranform format string',
    notes: 'Unsure about these',
    units: [
      { input: '${TM_FILEPATH/a/\\/$1/g}', expected: '\\/\\/' },
      { input: '${TM_FILEPATH/a/in\\/$1ner/g}', expected: 'in\\/nerin\\/ner' },
      { input: '${TM_FILEPATH/a/end\\//g}', expected: 'end\\/end\\/' },

      { input: '${TM_FILEPATH/(a)/\\/$1/g}', expected: '\\/a\\/a' },
      { input: '${TM_FILEPATH/(a)/in\\/$1ner/g}', expected: 'in\\/anerin\\/aner' },
      { input: '${TM_FILEPATH/(a)/end\\//g}', expected: 'end\\/end\\/' }
    ]
  },
  {
    describe: 'variable transforms',
    units: [
      { input: '${foo/([A-Z][a-z])/format/}', expected: '' },
      { input: '${foo///}', expected: '' },
      { input: '${foo/regex/format/gmi}', expected: '' },
      { input: '${TM_DIRECTORY/.*[\\/](.*)$/$1/}', expected: 'lib' },
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
      { input: '${TM_FILENAME/b.*/${0:xyz}/i}', expected: '' },
      {
        it: 'should return entire string when regex is invalid',
        input: '${foo/([A-Z][a-z])/format/GMI}',
        expected: '${foo/([A-Z][a-z])/format/GMI}',
      },
      {
        it: 'should return entire string when regex is invalid',
        input: '${foo/([A-Z][a-z])/format/funky}',
        expected: '${foo/([A-Z][a-z])/format/funky}',
      },
      {
        it: 'should return entire string when regex is invalid',
        input: '${foo/([A-Z][a-z]/format/}',
        expected: '${foo/([A-Z][a-z]/format/}',
      },
      { input: '${foo/m\\/atch/$1/i}', expected: '' },
      { input: '${foo/regex\\/format/options}', expected: '' },
      {
        it: 'should not choke on incomplete expressions',
        input: '${foo///',
        expected: '${foo///',
      },
      {
        it: 'should not choke on incomplete expressions',
        input: '${foo/regex/format/options',
        expected: '${foo/regex/format/options',
      }
    ]
  },
  {
    describe: 'choices',
    it: 'should parse tabstops with choices',
    units: [
      { input: '${1|one,two,three|}', expected: 'one' },
      { input: '${1|one|}', expected: 'one' },
      { input: '${1|one1,two2|}', expected: 'one1' }
    ]
  },
  {
    describe: 'choices',
    it: 'should ignore $0',
    units: [
      { input: '${0|foo,bar|}', expected: '${0|foo,bar|}' },
    ]
  },
  {
    describe: 'choices',
    it: 'should respect escaped values in choices',
    notes: 'See Microsoft/vscode#58494',
    units: [
      { input: '${1|one1\\,two2|}', expected: 'one1,two2' },
      { input: '${1|one1\\|two2|}', expected: 'one1|two2' },
      { input: '${1|one1\\atwo2|}', expected: 'one1\\atwo2' },
      {
        input: 'console.log(${1|not\\, not, five, 5, 1   23|});',
        expected: 'console.log(not, not);'
      },
      { input: '${1|${}},\\,,,$,\\|,\\\\|}', expected: '${}}' },
      { input: '${1|\\,,},$,\\|,\\\\|}', expected: ',' }
    ]
  },
  {
    describe: 'choices',
    it: 'should ignore escaped choice expressions',
    units: [
      { input: '\\${1|one,two,three|}', expected: '\\${1|one,two,three|}' },
      { input: '${1\\|one,two,three|}', expected: '${1\\|one,two,three|}' }
    ]
  },
  {
    describe: 'choices',
    it: 'should ignore choice expressions with no choices',
    units: [{ input: '${1||}', expected: '${1||}' }]
  },
  {
    describe: 'choices',
    it: 'should ignore invalid choice expressions',
    units: [{ input: '${1|one,', expected: '${1|one,' }]
  },
  {
    describe: 'choices',
    it: 'should support empty choices',
    notes: 'fixes Microsoft/vscode#34368',
    units: [{ input: '${1|one,two,three,|}', expected: 'one' }, { input: '${1|,one,two,three|}', expected: '' }]
  },
  {
    describe: 'placeholders',
    units: [
      {
        input: '${1:}',
        it: 'should work with empty placeholders',
        expected: ''
      },
      {
        input: 'console.warn(${1: $TM_SELECTED_TEXT })',
        expected: 'console.warn( FOOBAR )'
      },
      {
        input: 'console.log(${1|not\\, not, five, 5, 1   23|});',
        method: 'stringify',
        expected: 'console.log(${1|not\\, not, five, 5, 1   23|});'
      },
      {
        input: 'console.log(${1|not\\, not, \\| five, 5, 1   23|});',
        method: 'stringify',
        expected: 'console.log(${1|not\\, not, \\| five, 5, 1   23|});'
      }
    ]
  },
  {
    describe: 'nested placeholders',
    units: [
      { input: '${1:${foo:${1}}}', expected: '' },
      { input: '${1:${foo:${1}}}', expected: 'BAR', data: { foo: 'BAR' } },
      { skip: true, input: '${1:${foo:one${1}two}}', expected: 'onetwo' },
      { input: '${1:${foo:${1}}}', expected: 'abc', tabstops: { 1: 'abc' } },
    ]
  },
  {
    describe: '.stringify()',
    units: [
      {
        input: 'this is text',
        method: 'stringify',
        expected: 'this is text'
      },
      {
        input: 'this ${1:is ${2:nested with $var}}',
        method: 'stringify',
        expected: 'this ${1:is ${2:nested with $var}}'
      },
      {
        input: 'this ${1:is ${2:nested with $var}}}',
        method: 'stringify',
        expected: 'this ${1:is ${2:nested with $var}}}'
      },
      {
        input: 'console.log(${1|not\\, not, five, 5, 1   23|});',
        expected: 'console.log(${1|not\\, not, five, 5, 1   23|});',
        method: 'stringify'
      },
      {
        input: 'console.log(${1|not\\, not, \\| five, 5, 1   23|});',
        expected: 'console.log(${1|not\\, not, \\| five, 5, 1   23|});',
        method: 'stringify'
      },
      {
        input: 'this is text',
        expected: 'this is text',
        method: 'stringify'
      },
      {
        input: 'this ${1:is ${2:nested with $var}}',
        expected: 'this ${1:is ${2:nested with $var}}',
        method: 'stringify'
      },
      {
        input: 'this ${1:is ${2:nested with $var}}}',
        expected: 'this ${1:is ${2:nested with $var}}}',
        method: 'stringify'
      },
      {
        input: 'this ${1:is ${2:nested with $var}} and repeating $1',
        expected: 'this ${1:is ${2:nested with $var}} and repeating $1',
        method: 'stringify'
      }
    ]
  }
];

const assert = require('assert').strict;

const render = (input, options = {}, tabstops, data) => {
  let ast = parse(input);

  if (options.method) {
    return ast[options.method]();
  }

  let fn = ast.compile(options);
  let result = fn({ ...process.env, ...data }, tabstops);
  // console.log([input, result]);
  return result;
};

let count = 0;

const only = fixtures.find(ele => {
  if (ele.only === true) {
    return ele;
  }
  if (ele.units) {
    return ele.units.find(e => e.only === true);
  }
  return false;
});

const unit = fixture => {
  if (fixture.skip !== true) {
    if (Array.isArray(fixture.units)) {
      fixture.units.forEach(ele => unit(ele));
      return;
    }

    console.log('---', ++count);
    const tabstops = new Map();

    if (fixture.tabstops) {
      for (let key of Object.keys(fixture.tabstops)) {
        tabstops.set(Number(key), fixture.tabstops[key]);
      }
    }

    const options = { method: fixture.method };
    const actual = render(fixture.input, options, tabstops, fixture.data);
    console.log(' INPUT =>', [fixture.input]);
    console.log('OUTPUT =>', [actual, fixture.expected]);
    assert.equal(actual, fixture.expected);
    console.log();
  }
};

if (only) {
  unit(only);
} else {
  for (let fixture of fixtures) {
    unit(fixture);
  }
}

// render('foo ${name} bar');
// render('foo ${name:Jon Schlinkert} bar');
// render('foo ${1:${name:Jon Schlinkert}} bar');
// render('foo ${ThisIsAVar/([A-Z]).*(Var)/$2-${1:/downcase}/} bar');
// render('foo ${TM_FILENAME/([${FOO}A-Z_\\]]+)/${1:/downcase}/g} bar');
// render('name=${TM_FILENAME/(.*)\\..+$/$1/}');
// render('foo ${TM_SELECTED_TEXT:${"foo:\\"bar"}} bar', null, { 'foo:bar': 'baz' });
// render('${TM_FILENAME/^(.)|(?:-(.))|(\\.js)/$2-${1:/upcase}${2:/upcase}/g}', null, { 'foo:bar': 'baz' });
