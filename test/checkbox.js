'use strict';

require('mocha');
const colors = require('ansi-colors');
const assert = require('assert').strict;
const Session = require('..');

const render = (input, data, options, closed = false) => {
  const session = new Session(input, { dot: true, decorate: true, ...options });
  const ast = session.parse();
  const fn = ast.compile();
  session.closed = closed;
  return fn(data);
};

describe.only('Checkbox (extended field)', () => {
  describe('when not enabled on options', () => {
    it('should not parse Checkbox fields', () => {
      const input = `
      Favorite fruits?

        \${[x]:Apple}
        \${[ ]:Banana}
        \${[x]:Strawberry}
        \${[ ]:Lemon}
        \${[ ]:Watermelon:Pick this one}
      `;

      assert.equal(render(input), input);
    });
  });

  describe('when enabled on options.extensions', () => {
    it('should parse Checkbox fields', () => {
      const opts = { extensions: true, colors: false };
      const input = `
      Favorite fruits?

        \${[x]:Apple}
        \${[ ]:Banana}
        \${[x]:Strawberry}
        \${[ ]:Lemon}
        \${[ ]:Watermelon:Pick this one}
      `;

      const expected = `
      Favorite fruits?

        ✔ Apple
        ✖ Banana
        ✔ Strawberry
        ✖ Lemon
        ✖ Watermelon Pick this one
      `

      assert.equal(render(input, null, opts, true), expected);
    });
  });
});
