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
      if (seen.has(this)) return;
      seen.add(this);
      let groups = session.groups || (session.groups = { A: [], B: [] });
      let group = count++ < 3 ? 'A' : 'B';
      if (!groups[group].includes(this)) {
        groups[group].push(this);
        this.group = group;
      }
    }
  },
  onClose(output, session) {
    for (let key of Object.keys(session.groups)) {
      session.groups[key] = session.groups[key].map(e => ({ [e.name]: e.enabled }));
    }
  },
  actions: {
    // left() {
    //   if (!this.focused.choices) return;
    //   if (this.focused.cursor > 0) {
    //     this.focused.cursor--;
    //   }
    // },
    // right() {
    //   if (!this.focused.choices) return;
    //   if (this.focused.cursor < this.focused.choices.length - 1) {
    //     this.focused.cursor++;
    //   }
    // },
    prev() {
      return this.group === 'A' ? 'B' : 'A';
      // if (this.index > 0) {
      //   this.index--;
      // }
    },
    next() {
      return this.prev();
      // if (this.index < this.length - 1) {
      //   this.index++;
      // }
    },
    up() {
      if (this.index > 0) {
        this.index--;
      }
    },
    down() {
      if (this.index < this.length - 1) {
        this.index++;
      }
    }
  }
});
