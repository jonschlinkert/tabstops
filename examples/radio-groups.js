'use strict';

const prompt = require('./support/prompt');

const input = `
Even:
  \${(x)#1:Two}
  \${( )#1:Four}
  \${( )#1:Six}

Odd:
  \${(x)#2:One}
  \${( )#2:Three}
  \${( )#2:Five}
`;

prompt(input, {
  onClose(output, session) {
    let groups = session.groups;
    let keys = [...groups.keys()];
    let result = {};

    for (let key of keys) {
      result[key] = groups.get(key).items.map(e => ({ [e.name]: e.enabled }));
    }

    console.log(result);
  }
});
