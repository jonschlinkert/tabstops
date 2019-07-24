'use strict';

const path = require('path');
const colors = require('ansi-colors');
const parse = require('../lib/parse');

process.env.TM_FILENAME = 'parse.js';
process.env.TM_FILEPATH = path.resolve(__dirname, '../lib/parse.js');
process.env.TM_DIRECTORY = path.resolve(__dirname, '../lib');
process.env.TM_SELECTED_TEXT = 'FOOBAR';

const log = console.log;

const formatters = {
  block(state) {
    log(`<Block: <${state.resolved}: "${state.value}">`);
    return colors.yellow.bold(`<${state.value}>`);
  },

  choices(state) {
    log(`<Choices: <${state.resolved}: "${state.value}">`);
    return colors.yellow.bold(`<${state.value}>`);
  },

  format(state) {
    log(`<Format: <${state.resolved}: "${state.value}">`);
    return colors.underline(`<${state.value}>`);
  },

  tabstop(state) {
    log(`<Tabstop: <${state.resolved}: "${state.value}">`);
    return colors.blue(`<${state.value}>`);
  },

  tabstop_placeholder(state) {
    log(`<TabstopPlaceholder: <${state.resolved}: "${state.value}">`);
    return colors.blue.italic(`<${state.value}>`);
  },

  tabstop_transform(state) {
    log(`<TabstopTransform: <${state.resolved}: "${state.value}">`);
    return colors.blue.underline(`<${state.value}>`);
  },

  text(state) {
    log(`<Text: <${state.resolved}: "${state.value}">`);
    return colors.green(`<${state.value}>`);
  },

  variable(state) {
    log(`<Variable: <${state.resolved}: "${state.value}">`);
    return colors.yellow(`<${state.value}>`);
  },

  variable_placeholder(state) {
    log(`<VariablePlaceholder: <${state.resolved}: "${state.value}">`);
    return colors.cyan(`<${state.value}>`);
  },

  variable_transform(state) {
    log(`<VariableTransform: <${state.resolved}: "${state.value}">`);
    return colors.red(`<${state.value}>`);
  }
};

const fixtures = [
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
    describe: 'placeholder transforms',
    units: [
      { input: '${1///}', expected: '' },
      { input: '${1/regex/format/gmi}', expected: '' },
      { input: '${1/([A-Z][a-z])/format/}', expected: '' },
      { input: '${1/(void$)|(.+)/${1:?-\treturn nil;}/}', expected: '' }
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
    // only: true,
    it: 'should ignore $0',
    units: [
      { input: '${0|foo,bar|}', expected: '${0|foo,bar|}' }
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
      }
    ]
  },
  {
    describe: 'nested placeholders',
    units: [
      { input: '${1:${foo:${1}}}', expected: '' },
      { input: '${1:${foo:${1}}}', expected: 'BAR', data: { foo: 'BAR' } },
      { skip: true, input: '${1:${foo:one${1}two}}', expected: 'onetwo' },
      { input: '${1:${foo:${1}}}', expected: 'abc', tabstops: { 1: 'abc' } }
    ]
  }
];

const assert = require('assert').strict;

const render = (input, options = {}, tabstops, data) => {
  let ast = parse(input);

  if (options.method) {
    return ast[options.method](options);
  }

  let fn = ast.compile(options);
  return fn({ ...process.env, ...data }, tabstops);
};

let count = 0;
const getOnly = arr => {
  for (let ele of arr) {
    if (ele.only === true) {
      return ele;
    }
    if (ele.units) {
      let unit = getOnly(ele.units);
      if (unit) return unit;
    }
  }
};

const only = getOnly(fixtures);

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
    if (process.env.DEBUG) {
      options.formatters = formatters;
    }

    const actual = render(fixture.input, options, tabstops, fixture.data);
    const plain = colors.unstyle(actual).replace(/(<+|>+)/g, '');

    console.log(' INPUT =>', [fixture.input]);
    console.log('OUTPUT =>', [plain, fixture.expected]);
    console.log('COLORS =>', actual);
    assert.equal(plain, fixture.expected);

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
