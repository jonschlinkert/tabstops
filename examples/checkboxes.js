'use strict';

const prompt = require('./support/prompt');

const str = `
Favorite fruits?

  \${[x]:Apple}
  \${[ ]:Banana}
  \${[x]:Strawberry}
  \${[]:Lemon}
  \${[]:Watermelon:Pick this one}
`;

prompt(str);
