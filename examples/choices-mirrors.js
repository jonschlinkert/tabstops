'use strict';

const prompt = require('./support/prompt');

const survey = `
Add some numbers:
  \${1:\${2|Foo,Bar,Baz|}}

`;

prompt(survey);
