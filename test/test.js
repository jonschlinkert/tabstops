'use strict';

require('mocha');
const assert = require('assert');
const render = require('../lib/render');
const assertRender = async (str, expected, options) => {
  assert.equal((await render(str, null, options)), expected);
};

describe('literals', () => {
  it('should render a template variable', async () => {
    await assertRender('$', '$');
    await assertRender('\\\\$', '\\\\$');
    await assertRender('{', '{');
    await assertRender('\\}', '\\}');
    await assertRender('\\abc', '\\abc');
    await assertRender('foo${f:\\}}bar', 'foo\\}bar');
    await assertRender('\\{', '\\{');
    await assertRender('I need \\\\\\$', 'I need \\\\\\$');
    await assertRender('\\', '\\');
    await assertRender('\\{{', '\\{{');
    await assertRender('{{', '{{');
    await assertRender('{{dd', '{{dd');
    await assertRender('}}', '}}');
    await assertRender('ff}}', 'ff}}');
    await assertRender('foobar', 'foobar');
    await assertRender('foo{{}}bar', 'foo{{}}bar');
    await assertRender('foo{{123}}bar', 'foo{{123}}bar');
    await assertRender('foo\\{{123}}bar', 'foo\\{{123}}bar');
    await assertRender('foo{{faz:baz}}bar', 'foo{{faz:baz}}bar');
    await assertRender('foo{{faz:baz {{qux}}}}bar', 'foo{{faz:baz {{qux}}}}bar');
    await assertRender('foo{{faz:baz {{faz:qux}}}}bar', 'foo{{faz:baz {{faz:qux}}}}bar');
  });

  it('should render literal code', async () => {
    await assertRender('foo`123`bar', 'foo`123`bar');
    await assertRender('foo\\`123\\`bar', 'foo\\`123\\`bar');
  });

  it('should render variables/tabstop', async () => {
    await assertRender('$foo-bar', '-bar');
    await assertRender('\\$foo-bar', '\\$foo-bar');
    await assertRender('foo$foobar', 'foo');
    await assertRender('foo${foobar}', 'foo');
    await assertRender('$123', '');
    await assertRender('$foobar', '');
    await assertRender('$foo12bar', '');
    await assertRender('000_${foo}_000', '000__000');
    await assertRender('FFF_${TM_SELECTED_TEXT}_FFF$0', 'FFF__FFF');
  });
});
