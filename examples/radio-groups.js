'use strict';

const prompt = require('./support/prompt');

const str = `
Even:
  \${(x):Two}
  \${( ):Four}
  \${( ):Six}

Odd:
  \${(x):One}
  \${( ):Three}
  \${( ):Five}
`;

let seen = new Set();
let count = 0;

prompt(str, {
  fields: {
    radio(output, session) {
      let groups = session.groups || (session.groups = { A: [], B: [] });
      if (!seen.has(this)) {
        seen.add(this);
        this.group = count++ < 3 ? 'A' : 'B';
        groups[this.group].push(this);
      }
    }
  },
  onClose(output, session) {
    for (let key of Object.keys(session.groups)) {
      session.groups[key] = session.groups[key].map(e => ({ [e.name]: e.enabled }));
    }
  }
});
