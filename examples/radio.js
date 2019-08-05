'use strict';

const prompt = require('./support/prompt');

const str = `
Favorite fruits?

  \${( ):Apple}
  \${( ):Banana}
  \${(x):Strawberry}
  \${( ):Lemon}
  \${( ):Watermelon:Pick this one}
`;

prompt(str, {
  onClose() {
    console.log(this.parser);
  }
});
