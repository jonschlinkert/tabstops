'use strict';

const prompt = require('./support/prompt');
const colors = require('ansi-colors');;
const { bgCyan, cyan, dim, symbols, bold } = colors;
const q = cyan(symbols.question);
const s = dim(symbols.ellipsis);

const prefix = q;
const sep = s;
const msg = bold('What is your name?');
const hint = dim('<Start typing>');

// const input = '#{prefix} #{message:Name?} #{sep} ${1:#{hint:<Start typing>}}';
// const input = `${q} ${bold('What is your name?')} ${s} ${cyan(`\${1:${dim('Start Typing')}}`)}`;

// const input = q + ' What is your name? ${1}';
const input = '#{prefix} #{message:Name?} #{sep} ${1:#{hint:<Start typing>}}';

// prompt(input, {
//   data: {
//     message: 'What is your name?',
//     hint: '<Full name>'
//   }
// });

// const format = function(state, session) {
//   if (session && session.focused === this) {
//     const u = colors.underline;
//     const s = this.choices ? u.green : u.cyan;
//     return s(state.value);
//   }
//   return state.value;
// };

// prompt('What is your name? $1', {
//   onClose() {
//     prompt('Are you sure? ${1|yes,no|}', { format });
//   },
//   format
// });

prompt('What is your name? ${1:${c}}', { data: { c: bgCyan(' ') }});
// prompt('What is your name? ${1:<start typing>}');
// prompt('What is your name? ${1:' + dim('<start typing>') + '}');
// prompt('What is your name? ${1:${hint}}', { data: { hint: dim('<start typing>') } });
