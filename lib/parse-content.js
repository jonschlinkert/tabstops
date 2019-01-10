'use strict';

const define = require('./define');
const location = require('./location');
const parseTabstop = require('./parse-tabstop');

module.exports = (input, options) => {
  let state = { loc: { index: 0, column: 0, line: 1 } };

  let loc = location(state);
  let peek = (n = 0) => input[state.loc.index + n];
  let next = () => input[(++state.loc.index) - 1];

  let astLoc = loc;
  let ast = { type: 'root', input: Buffer.from(input), nodes: [] };
  let block = ast;
  let stack = [ast];
  let aft, val, token, regex, parent, value, last, type, textLoc;

  let append = node => {
    if (!node.value) return;
    loc(node);
    if (node.type === 'text' && last && last.type === 'text') {
      last.value += node.value;
      last.loc.end = node.loc.end;
    } else {
      if (!node.parent) define(node, 'parent', block);
      block.nodes.push(loc(node));
    }
  };

  while (state.loc.index < input.length) {
    loc = location(state);

    value = next();
    block = stack[stack.length - 1];
    last = block.nodes[block.nodes.length - 1];

    let node = { type: 'text', value };

    switch (value) {
      case '\\':
        node.value = next();
        append(loc(node));
        break;

      case '\n':
        state.loc.line++;
        append(loc(node));
        break;

      case '$':
      case '#':
        val = peek();
        aft = peek(1);

        if (val === '{' && aft !== '{') {
          type = 'BRACE';
          node.value += next();
        } else if (/\w/.test(val)) {
          type = 'VARIABLE';
        } else {
          append(loc(node));
          break;
        }

        textLoc = location(state);
        token = { type: 'text', value: '' };
        regex = type === 'BRACE' ? /[$#{}]/ : /[ \W]/;

        while (state.loc.index < input.length) {
          value = next();

          if (value === '\\') {
            token.value += value + next();
            continue;
          }

          token.value += value;

          if (regex.test((val = peek()))) {
            break;
          }
        }

        if (token.value) {
          token = parseTabstop(token);
        }
        // console.log(token)

        if (type === 'VARIABLE') {
          type = 'template';
        }

        node.type = 'open';
        parent = loc({ type, nodes: [node, textLoc(token)] });
        define(node, 'parent', parent);
        define(token, 'parent', parent);
        define(parent, 'parent', block);
        block.nodes.push(parent);
        stack.push(parent);
        break;

      case '}':
        if (block.type === 'BRACE') {
          loc(node);
          node.type = 'close';
          block.type = 'template';
          block = stack.pop();
          block.loc.end = node.loc.end;
          define(node, 'parent', block);
          block.nodes.push(node);
          break;
        }
        append(node);
        break;

      default: {
        if (block.type === 'VARIABLE' && !/\w/.test(value)) {
          loc(node);
          block.type = 'template';
          block = stack.pop();
          block.loc.end = node.loc.end;
          let close = loc({ type: 'close', value: '' });
          define(close, 'parent', block);
          define(node, 'parent', block);
          block.nodes.push(close);
          block = stack[stack.length - 1];
        }

        append(node);
        break;
      }
    }
  }

  astLoc(ast);
  // console.log(ast.nodes)
  return ast;
};

