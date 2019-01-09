'use strict';

const parseContent = require('./parse-content');
const define = require('./define');

const parseSnippet = (str, options) => {
  let ast = { type: 'root', input: Buffer.from(str), nodes: [] };
  let stack = [ast];
  let tokens = [];
  let queue = [];
  let prevNode = ast;
  let parent = ast;
  let index = 0;
  let line = 0;
  let match;

  let eos = () => !str && queue.length === 0;
  let enqueue = node => node && queue.push(node);
  let dequeue = () => queue.shift();
  let lookahead = (n = 1) => {
    let fetch = n - queue.length;
    while (fetch-- > 0 && enqueue(advance()));
    return queue[--n];
  };

  let peek = () => lookahead(1);
  let next = () => dequeue() || advance();
  let advance = () => {
    str = str.slice(1);
    return str[0];
  };

  let push = node => {
    define(node, 'match', node.match);
    node.line = line;
    node.index = index;

    if (node.value) index += node.value.length;
    if (!node.value && !node.nodes) return;
    if (node.type === 'text' && prevNode.type === 'text') {
      prevNode.value += node.value;
      return;
    }

    prevNode = node;
    tokens.push(node);
    parent.nodes.push(node);
    define(node, 'parent', parent);

    if (node.nodes) {
      stack.push(node);
      parent = node;
    } else if (node.type === 'close') {
      stack.pop();
      parent = stack[stack.length - 1];
    }
  };

  while (!eos()) {
    let value = str[0];

    if (value === '\\') {
      value = next();
      match = [value];
      match.input = str;
      match.index = index;
      push({ type: 'text', value, match, index });
      str = str.slice(value.length);
      continue;
    }

    if (value === '\n') {
      push({ type: 'text', value, match, index });
      str = str.slice(1);
      continue;
    }

    if ((match = /^<!\[CDATA\[([\s\S]*?)\]\]>/.exec(str))) {
      str = str.slice(match[0].length);
      let block = parseContent(match[1], options, index);
      tokens.push(block);
      define(block, 'parent', parent);
      define(block, 'match', match);
      parent.nodes.push(block);
      continue;
    }

    if ((match = /^<(?!!\[CDATA)(\/?)([^>]+)>/.exec(str))) {
      str = str.slice(match[0].length);

      if (match[1] === '/') {
        push({ type: 'close', value: match[0], match });
        continue;
      }

      let block = { type: 'tag', name: match[2], nodes: [], match };
      let open = { type: 'open', value: match[0] };
      block.nodes.push(open);
      push(block);
      continue;
    }

    if ((match = /^(\\[<]|[^<])+?/.exec(str))) {
      str = str.slice(match[0].length);
      push({ type: 'text', value: match[1], match });
    }
  }

  return ast;
};

module.exports = parseSnippet;
