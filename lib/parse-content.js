'use strict';

const parseExpression = (input, options) => {

};

module.exports = (input, options, fn) => {
  let ast = { type: 'root', input: Buffer.from(input), nodes: [] };
  let stack = [ast];
  let tokens = [];
  let string = input;
  let state = { loc: { index: 0, column: 1, line: 1 } };
  let index = 0;
  let value;
  let block;
  let last;
  let val;
  let end;

  let append = value => {
    if (!value) return;
    if (last && last.type === 'text') {
      last.value += value;
    } else {
      block.nodes.push({ type: 'text', value });
    }
  };

  let isMatch = val => {
    if (val === '{') return str => str === '}';
    if (/[\w_]/.test(val)) {
      return str => /[^\w_]/.test(str);
    }
  };

  let peek = () => string[index + 1];
  let next = () => string[++index];

  while (index < string.length) {
    value = next();
    block = stack[stack.length - 1];
    last = block.nodes[block.nodes.length - 1];

    switch (value) {
      case '\\':
        value += next();
        append(value);
        break;

      case '\n':
        state.loc.line++;
        append(value);
        break;

      case '$':
      case '#':
        val = peek();
        end = isMatch(val);

        if (end) {
          let n = next();
          value += n;

          let token = { type: 'template', value, inner: '' };
          if (n !== '{') token.inner += n;

          while (!end(peek())) {
            value = next();
            token.value += value;
            token.inner += value;

            if (value === '\\') {
              value += next();
              token.inner += value;
              token.value += value;
            }
          }

          token.value += next();
          block.nodes.push(token);
          break;
        }

        append(value);
        break;

      default: {
        append(value);
        break;
      }
    }
  }

  console.log(ast)
  return ast;
};
