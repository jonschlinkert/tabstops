'use strict';

const prompt = require('./support/prompt');
const str = `#{prefix} #{message:Favorite fruits?}

  \${[x]:Apple}
  \${[ ]:Banana}
  \${[x]:Strawberry}
  \${[ ]:Lemon}
  \${[ ]:Watermelon:Pick this one}

`;

prompt(str, {
  fields: {
    checkbox: {
      format(output, state) {
        return output;
      }
    }
  }
});
