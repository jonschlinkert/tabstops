'use strict';

const {
  Block,
  Choices,
  Format,
  Node,
  Tabstop,
  TabstopPlaceholder,
  TabstopTransform,
  Transform,
  Variable,
  VariablePlaceholder,
  VariableTransform
} = require('./nodes');

const parse = (input, options) => {
  const fields = new Map();
  const state = { index: 0, token: null };
  const ast = new Block({ type: 'root', nodes: [] });
  const stack = [ast];

  let block = ast;
  let prev = null;
  let token;

  const eos = () => state.index >= input.length;
  const peek = () => input[state.index + 1];
  const next = () => (input[state.index++] || '');
  const rest = () => input.slice(state.index);

  const push = node => {
    if (prev && prev.type === 'text' && node.type === 'text') {
      prev.append(node);
      return;
    }

    if (!(node instanceof Node)) {
      node = new Node(node);
    }

    block.fields = fields;
    node.fields = fields;

    block.push(node);

    if (node.nodes) {
      stack.push(node);
      block = node;
    }

    prev = node;
  };

  const match = (regex, type = 'text') => {
    token = null;

    let m = regex.exec(rest());
    if (m) {
      token = { type, value: m[0], match: m };
      state.index += m[0].length;
      return token;
    }
  };

  while (!eos()) {
    if (state.index === 0 && match(/^\ufeff/, 'bom')) {
      push(token);
      continue;
    }

    // escaped chars
    if (match(/^\\[^\\]/, 'text')) {
      push(token);
      continue;
    }

    if (stack.some(node => node instanceof Transform)) {
      if (match(/^\[(\\.|[^\]])+\]/, 'text')) {
        push(token);
        continue;
      }

      if (match(/^\$(?:([0-9]+)|{([0-9]+|[_a-zA-Z][_a-zA-Z0-9]*)([-?+:/]+)(.*?)})/)) {
        push(new Format(token));
        continue;
      }
    }

    if (match(/^\$(?:(?=([0-9]+))\1|{([0-9]+)})/, 'tabstop')) {
      let node = new Tabstop(token);
      let field = fields.get(node.tabstop) || [];
      field.push(node);
      fields.set(node.tabstop, field);
      push(node);
      continue;
    }

    if (match(/^\$(?:(?=([_a-zA-Z][_a-zA-Z0-9]*))\1|{([_a-zA-Z][_a-zA-Z0-9]*)})/, 'variable')) {
      push(new Variable(token));
      continue;
    }

    // if (match(/^(?:\$\{([0-9]+)\|(\\\||[^|])+\|\})/, 'choices')) {
    if (match(/^(?:\$\{([1-9]+)\|([\s\S]+?)(?<!(?<!\\)\\)\|\})/, 'choices')) {
      push(new Choices(token));
      continue;
    }

    if (match(/^\${([0-9]+):/, 'open')) {
      push(new TabstopPlaceholder());
      push(token);
      continue;
    }

    if (match(/^\${([_a-zA-Z][_a-zA-Z0-9]*):/, 'open')) {
      push(new VariablePlaceholder());
      push(token);
      continue;
    }

    if (match(/^\${([0-9]+)\//, 'open')) {
      push(new TabstopTransform());
      push(token);
      continue;
    }

    if (match(/^\${([_a-zA-Z][_a-zA-Z0-9]*)\//, 'open')) {
      push(new VariableTransform());
      push(token);
      continue;
    }

    if (match(/^\${/, 'open')) {
      push(new Block({ type: 'variable' }));
      push(token);
      continue;
    }

    if (match(/^(\r?\n|\r)/, 'newline')) {
      push(token);
      continue;
    }

    let value = next();

    if (value === '"' || value === '\'') {
      let open = value;
      while (!eos() && peek() !== open) {
        let char = next();
        if (char === '\\') {
          char += next();
        }
        value += char;
      }
      value += next();
      push({ type: 'text', value });
      continue;
    }

    if (stack.some(node => node instanceof Transform) && value === '/') {
      push({ type: 'slash', value });
      continue;
    }

    if (value === '}') {
      push({ type: 'close', value });
      block = stack.pop();

      if (block.type.endsWith('_transform')) {
        block.params = block.parse();
      }

      if (typeof block.tabstop === 'number') {
        let field = fields.get(block.tabstop) || [];
        field.push(block);
        fields.set(block.tabstop, field);
      }

      block = stack[stack.length - 1];
      continue;
    }

    push({ type: 'text', value });
  }

  while (stack.length > 1) {
    block = stack.pop();
    block.replace(new Node({ type: 'text', value: block.stringify() }));
  }

  return ast;
};

module.exports = parse;
