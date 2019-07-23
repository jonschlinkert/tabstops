
const Lexer = require('../Lexer');
const lexer = new Lexer('5*(1+2)');

lexer.handler('number', prev => {
  let match = lexer.match(/^[0-9]+/);
  if (match) {
    return { type: 'number', value: match[0], match };
  }
});

lexer.handler('star', prev => {
  let match = lexer.match(/^\*/);
  if (match) {
    return { type: 'star', value: match[0], match };
  }
});

lexer.handler('plus', prev => {
  let match = lexer.match(/^\+/);
  if (match) {
    return { type: 'plus', value: match[0], match };
  }
});

lexer.handler('left_paren', prev => {
  let match = lexer.match(/^\(/);
  if (match) {
    return { type: 'left_paren', value: match[0], match };
  }
});

lexer.handler('right_paren', prev => {
  let match = lexer.match(/^\)/);
  if (match) {
    return { type: 'right_paren', value: match[0], match };
  }
  // return match[0]
});

lexer.tokenize();
console.log(lexer.tokens);
console.log(lexer.input.slice(...lexer.tokens[4].loc.range));
