'use strict';

const { bold, green, dim, symbols } = require('ansi-colors');
const prompt = require('./support/prompt');
const on = green(symbols.check);
const off = dim.gray(symbols.check);
const heading = bold.underline;

const input = `#{prefix} #{message:Please fill out the following fields}
  #{message:What is your name?} \${name:<start typing>}

  #{message:Favorite tropical fruits?}
    \${[ ]$1:Pineapple}
    \${[ ]$1:Banana}

  #{message:Favorite fruits?}
    \${[x]$2:Apple}
    \${[x]$2:Strawberry}
    \${[ ]$2:Lemon}
    \${[ ]$2:Watermelon:Pick this one}

`;

prompt(input, {
  zero: false,
  onClose(output, session) {
    let groups = session.groups;
    let keys = [...groups.keys()];
    let result = {};

    for (let key of keys) {
      result[key] = result[key] || {};
      groups.get(key).items.forEach(e => {
        result[key][e.name] = e.enabled;
      });
    }

    console.log(result);
  }
});
