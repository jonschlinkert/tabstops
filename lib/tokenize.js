'use strict';

const types = {
  '$': 'dollar',
  '{': 'brace_lt',
  '}': 'brace_rt',
  '\n': 'newline'
};

const tokenize = input => {
  let tokens = [];
  let token, prev;
  let i = -1;

  let peek = () => input[i + 1];
  let next = () => input[++i];
  let push = token => {
    if (prev && prev.type === 'text' && token.type === 'text') {
      prev.value += token.value;
    } else {
      tokens.push(token);
      prev = token;
    }
  };

  while (i < input.length - 1) {
    let value = next();

    if (value === '\\') {
      value += next();
      push({ type: 'text', value });
      continue;
    }

    push({ type: types[value] || 'text', value });
  }

  return tokens;
};

console.log(tokenize('${foo,bar}'))
