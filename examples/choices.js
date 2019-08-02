'use strict';

const fs = require('fs');
const prompt = require('./support/prompt');

const options = {
  visible: 7,
  fields: {
    keywords(value) {
      return `["${value.split(/,\s*/).join('", "')}"]`;
    },
    name: {
      format(value) {
        return value.split(',')
      },
      validate() {
        return false;
      }
    }
  },
  helpers: {
    helper(key) {
      return process.env[key];
    }
  },
  data: {
    home: require('os').homedir(),
    user: process.env.USER,
    array() {
      return ['one', 'two', 'three'];
    },
    _name: 'Brian',
    TM_FILENAME: __filename,
    ENV_FILENAME: 'index.js'
  }
};

// prompt('${1|${file}|}', {
//   data: {
//     file() {
//       return fs.readdirSync(process.cwd());
//     }
//   }
// });

// prompt(survey, {
//   readonly: ['total', 'numbers', 1],
//   invisible: [1],
//   display: 'list',
//   // invert: true,
//   actions: {
//     left() {
//       if (!this.focused.choices) return;
//       if (this.focused.cursor > 0) {
//         this.focused.cursor--;
//       }
//     },
//     right() {
//       if (!this.focused.choices) return;
//       if (this.focused.cursor < this.focused.choices.length - 1) {
//         this.focused.cursor++;
//       }
//     },
//     prev() {
//       if (this.index > 0) {
//         this.index--;
//       }
//     },
//     next() {
//       if (this.index < this.length - 1) {
//         this.index++;
//       }
//     }
//     // up() {
//     //   return this.prev();
//     // },
//     // down() {
//     //   return this.next();
//     // }
//   },
//   helpers: {
//     add(...args) {
//       return args.reduce((a, e) => a + +e, 0);
//     },
//     currency(value) {
//       return `$${Number(value).toFixed(2)}`;
//     }
//   },
//   // init(session, rl) {
//   //   rl.close();
//   // },
//   data: {
//     total(...args) {
//       let n = 0;
//       for (let [k, v] of this.values.tabstop) {
//         n += Number(v);
//       }
//       return String(n);
//     },
//     numbers() {
//       return [0, 1, 2, 3, 4, 5];
//     },
//     file() {
//       return fs.readdirSync(process.cwd());
//     }
//   }
// });

// prompt(string2, {
//   helpers: {
//     slugify(value) {
//       return value.toLowerCase().replace(/\W/g, '');
//     }
//   },
//   data: {
//     files() {
//       return fs.readdirSync(process.cwd());
//     }
//   }
// });
