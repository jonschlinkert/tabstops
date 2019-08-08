'use strict';

const fs = require('fs');
const colors = require('ansi-colors');
const prompt = require('./support/prompt');

const strings = [
`for (let i = 0; i < \${1:items}.length; i++) {
  let item = \${2:items}[i];
  $0
}`,

`for (let \${1:item} of \${2:items}) {
  $0
}`,

`for (let \${1:item} in \${2:items}) {
  let value = $2[$1];
  $0
}`
];

const snippets = [
  { name: 'for', contents: strings[0] },
  { name: 'for-of', contents: strings[1] },
  { name: 'for-in', contents: strings[2] }
];

const input = `
  function someFunction(a, b, c) {
    \${1|\${snippet}|}
  }
`;

prompt(input, {
  data: {
    snippet() {
      return snippets.map(s => s.name);
    }
  },
  render(item, state, session) {
    let snippet = snippets.find(s => s.name === state.value);
    let value = state.value;

    if (snippet && snippet.contents) {
      value = session.indent(snippet.contents, item.indent);
    }

    if (session && session.focused === item) {
      return colors.cyan(value);
    }

    return value;
  }
});
