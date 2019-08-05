'use strict';

const { green, dim, symbols } = require('ansi-colors');
const prompt = require('./support/prompt');
const on = green(symbols.check);
const off = dim.gray(symbols.check);

const input = `#{prefix} #{message:Favorite fruits?}

\\#{one}
  \${[x]#one:Apple}
  \${[ ]#one:Banana}

\\#{two}
  \${[x]#two:Strawberry}
  \${[ ]#two:Lemon}
  \${[ ]#two:Watermelon:Pick this one}

`;

prompt(input, {
  data: {
    tally(name) {
      let group = this.node.session.groups.get(name);
      let enabled = group.items.every(item => item.enabled);
      return (enabled ? on : off) + ' ' + this.node.name;
    }
  },
  // data: {
  //   one(value = this.name) {
  //     let group = this.session.groups.get(this.name);
  //     let enabled = group.items.every(item => item.enabled);
  //     return (enabled ? on : off) + ' ' + value;
  //   }
  // },
  // fields: {
  //   static(state) {
  //     let value = state.value || this.name;
  //     let group = this.session.groups.get(this.name);
  //     if (group) {
  //       let enabled = group.items.every(item => item.enabled);
  //       return (enabled ? on : off) + ' ' + value;
  //     }
  //     return state.value;
  //   }
  // },
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
