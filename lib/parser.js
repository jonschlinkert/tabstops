'use strict';

const parse = (input, options) => {
  let ast = { type: 'root', nodes: [] };
  let state = { line: 1, index: 0 };
  let stack = [ast];
  let block = ast;
  let brace;

  let next = () => input[++state.index];
  let peek = () => input[state.index + 1];
  let last = node => {
    let prev = node.nodes[node.nodes.length - 1];
    if (prev && prev.nodes) {
      return last(prev);
    }
    return prev;
  };

  let append = (node, block, prev) => {
    if (prev.type === 'text') {
      prev.value += node.value;
    } else {
      block.nodes.push(node);
    }
  };

  for (; state.index < input.length; state.index++) {
    let block = stack[stack.length - 1];
    let value = input[state.index];
    let prev = last(block);
    let node = { type: 'text', value };

    switch (value) {
      case '\\':
        node.value = next();
        block.nodes.push(node);
        break;

      case '\n':
        state.line++;
        block.nodes.push(node);
        break;

      case ':':
        append(node, block, prev);
        break;

      case '=':
        if (block.type === 'brace' && prev.type !== 'key') {
          block.key = prev.value;
          block.nodes.pop();
          break;
        }
        append(node, block, prev);
        break;

      case '$':
        if ((value = peek()) === '{' || /\w/.test(value)) {
          if (value === '{') next();
          node.value = '';
          let inner = '';

          while (state.index < input.length - 1 && (value = next())) {
            if (value === '}') break;
            inner += value;
          }

          console.log(inner);
          node.value += inner;
          // node.key = node.value;
          // node.value = '';
          // block.nodes.push(node);
          break;
        }

        append(node, block, prev);
        break;

      case '}':
        node.type = 'close';
        block = stack.pop();
        if (block.key === null && block.nodes.length === 2) {
          block.type = 'variable';
          block.key = prev.value;
          delete block.nodes;
          break;
        }
        block.nodes.push(node);
        break;

      default: {
        append(node, block, prev);
        break;
      }
    }
  }

  return ast;
};

const str = '$FOO';
const str = '${foo=$placeholder}';
// const str = '${foo=before ${ABC} middle ${XYZ} after}';
const ast = parse(str);

const compile = (ast, context = {}) => {
  let output = '';

  for (let node of ast.nodes) {
    if (node.key) {
      output += context[node.key] || (node.nodes ? compile(node, context) : node.key);
      continue;
    }

    if (node.nodes) {
      output += compile(node, context);
    } else if (node.type === 'text') {
      output += node.value;
    }
  }

  return output;
};

console.log(compile(ast, { foo: 'bar', ABC: 'What?', XYZ: 'Why?' }));
console.log(compile(ast, { foo: 'bar' }));
console.log(compile(ast, { XYZ: 'Why?', placeholder: 'temp' }));
console.log(compile(ast, { XYZ: 'Why?' }));
