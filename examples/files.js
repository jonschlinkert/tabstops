'use strict';

const fs = require('fs');
const colors = require('ansi-colors');
const prompt = require('./support/prompt');

const survey = `
Pick three files:
  \${1|\${files}|}
  \${2|\${files}|}
  \${3|\${files}|}
`;

prompt(survey, {
  data: {
    files() {
      return fs.readdirSync(process.cwd());
    }
  },
  format(state, session) {
    if (session && session.focused === this) {
      return colors.cyan.underline(state.value);
    }
    return state.value;
  }
});
