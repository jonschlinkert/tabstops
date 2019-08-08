'use strict';

const colors = require('ansi-colors');
const prompt = require('./support/prompt');

prompt(`
  {
    "name": "\${1:\${name:$TM_PROJECT_FOLDER}}",
    "description": "\${description}",
    "version": "\${version:0.1.0}",
    "repository": "\${owner:\${env.USER}}/$1",
    "main": "index.js",
    "license": "\${license:MIT}"
  }
`,
 {
  onClose(result, session) {
    // console.log([result.trim()])
    console.log(JSON.parse(result));
  }
});
