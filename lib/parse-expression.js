'use strict';

const parseExpression = (tok, options) => {
  let index = -1;
  let input = tok.value;
  let next = () => input[++index];
  let token = { type: 'variable', tabstop: '', key: '', value: '' };
  let type = 'tabstop';

  while (index < input.length - 1) {
    let value = next();

    if (type === 'tabstop' && !/^[0-9]$/.test(value)) {
      type = 'key';
    }

    if (tok.kind === 'BRACE' && type !== 'tabstop') {
      if (!token.tabstop || /\D/.test(token.tabstop)) {
        let idx = (input.search(/(?<!\\):/) + 1) || 5;
        throw new SyntaxError(`Invalid tabstop number: "{${input.slice(0, idx)}"`);
      }
    }

    if (value === '\\') {
      while (input[index + 1] === '\\') value += next();
      if (value.length % 2 !== 0) {
        value = next();
      } else {
        value = '\\\\';
      }
      token[type] += value;
      continue;
    }

    if (value === ':') {
      type = 'key';
      continue;
    }

    if (value === '=') {
      type = 'value';
      continue;
    }

    token[type] += value;
  }

  if (token.tabstop) {
    token.tabstop = Number(token.tabstop);
  }

  return token;
};

module.exports = parseExpression;
