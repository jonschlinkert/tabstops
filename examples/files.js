'use strict';

const fs = require('fs');
const prompt = require('./support/prompt');

const survey = `
Pick some files:
  \${1|\${files}|}
  \${2|\${files}|}
  \${3|\${files}|}
`;

prompt(survey, {
  data: {
    files() {
      return fs.readdirSync(process.cwd());
    }
  }
});
