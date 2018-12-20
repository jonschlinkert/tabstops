'use strict';

const define = require('./define');
const location = require('./location');
const State = require('./state');

module.exports = (str, options, fn) => {
  const state = new State(str);

  const updateLocation = (value, len = value.length) => {
    let i = value.lastIndexOf('\n');
    state.loc.column = ~i ? len - i : state.loc.column + len;
    state.loc.line += Math.max(0, value.split('\n').length - 1);
    state.loc.index += len;
  };

  const consume = (len, value = state.string.slice(0, len)) => {
    state.consumed += value;
    state.string = state.string.slice(len);
    updateLocation(value, len);
    return value;
  };

  const astLoc = location(state);
  const ast = {
    type: 'cdata',
    input: Buffer.from(state.string),
    nodes: []
  };

  let stack = state.stack = [ast];
  let prevNode = ast;
  let parent = ast;

  let eos = () => !state.string;
  let peek = () => state.string[1];
  let next = () => consume(1, state.string[0]);

  let push = token => {
    if (!token.value && !token.nodes) return;
    if (token.type === 'text' && prevNode.type === 'text') {
      prevNode.value += token.value;
      prevNode.loc.end = token.loc.end;
      return;
    }

    prevNode = token;
    state.tokens.push(token);
    parent.nodes.push(token);
    define(token, 'parent', parent);

    if (token.nodes) {
      stack.push(token);
      parent = token;
    } else if (token.type === 'close') {
      stack.pop();
      parent = stack[stack.length - 1];
    }
  };

  while (!eos()) {
    let value = state.string[0];
    let loc = location(state);

    switch (value) {
      case '\n':
        push(loc({ type: 'text', value: next() }));
        break;

      case '\\':
        while (peek() === '\\') value += next();
        value += next();
        push(loc({ type: 'text', value }));
        break;

      case '$':
      case '#':
        let block = { type: 'template', nodes: [] };

        if (value !== '#' && peek() !== '{') {
          consume(1);
          block.nodes.push(loc({ type: 'open', value }));
          value = '';
          while (/[\w_]/.test(peek())) value += next();
          // console.log([value])
          value += next();
          // console.log([state])
          block.nodes.push(loc({ type: 'text', value }));
          block.nodes.push(loc({ type: 'close', value: '' }));
          parent.nodes.push(loc(block));
          break;
        }

        consume(value.length, value);
        value += next();

        let child = { type: 'open', value };
        define(child, 'parent', block);
        block.nodes.push(child);
        push(block);

        let match = /^([0-9]+?):/.exec(state.string.slice(state.loc.index + 1));
        if (match) {
          child.value += match[0];
          block.tabstop = child.tabstop = Number(match[1]);
          consume(match[0].length, match[0]);
        }

        loc(child);
        loc(block);
        break;

      case '}':
        let type = parent.type === 'template' ? 'close' : 'text';
        push(loc({ type, value: next() }));
        break;

      default: {
        push(loc({ type: 'text', value: next() }));
        break;
      }
    }
  }

  astLoc(ast);
  return ast;
};
