'use strict';

const prompt = require('./support/prompt');

const survey = `
Add some numbers:
  \${1:\$3}
  \${3|Foo,Bar,Baz|}

`;

prompt(survey);
