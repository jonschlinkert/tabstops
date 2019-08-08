'use strict';

const prompt = require('./support/prompt');

prompt(`\${2|foo,bar|/(.*)/\${1:/upcase}/}`);
