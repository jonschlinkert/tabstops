'use strict';

const { REGEX_FORMAT_RE } = require('./constants');
const builtins = require('./helpers');

class Node {
  constructor(node) {
    this.type = node.type;

    for (let key of Object.keys(node)) {
      if (!(key in this)) {
        this[key] = node[key];
      }
    }

    if (this.match && !this.value) {
      this.value = this.match[0];
    }

    if (this.value && !this.match) {
      this.match = [this.value];
    }
  }

  clone() {
    let node = new this.constructor(this);
    if (node.nodes) {
      node.nodes = node.nodes.map(n => n.clone());
    }
    return node;
  }

  append(node) {
    if (this.value) {
      this.match[0] += node.value;
      this.value += node.value;
    }
  }

  replace(node) {
    this.siblings[this.index] = node;
    node.parent = this.parent;
  }

  remove() {
    this.siblings.splice(this.index, 1);
  }

  compile(options) {
    return () => this.value;
  }

  render(data, options, tabstops) {
    return this.compile(options)(data, tabstops);
  }

  stringify() {
    if (this.match && !this.nodes) {
      return this.match[0];
    }
    if (this.nodes) {
      return this.nodes.map(node => node.stringify()).join('');
    }
    return '';
  }

  isValue(value) {
    return value !== '' && value !== null && value !== void 0;
  }

  get siblings() {
    return (this.parent && this.parent.nodes) || [];
  }

  get index() {
    return this.siblings.indexOf(this);
  }
}

class Block extends Node {
  constructor(node = {}) {
    super(node);
    this.nodes = [];
  }

  push(node) {
    Reflect.defineProperty(node, 'parent', { value: this });
    this.nodes.push(node);
  }

  compile(options) {
    let fns = this.nodes.map(node => node.compile(options));
    return (data, tabstops) => {
      let value = fns.map(fn => fn(data, tabstops)).join('');
      if (value !== void 0 && this.tabstop !== void 0) {
        tabstops.set(this.tabstop, value);
      }
      return value;
    };
  }

  get innerNodes() {
    return (this.openNode && this.closeNode) ? this.nodes.slice(1, -1) : this.nodes;
  }
  get firstChild() {
    return this.nodes[0];
  }
  get lastChild() {
    return this.nodes[this.nodes.length - 1];
  }
  get openNode() {
    if (this.firstChild && this.firstChild.type === 'open') {
      return this.firstChild;
    }
    return null;
  }
  get closeNode() {
    if (this.lastChild && this.lastChild.type === 'close') {
      return this.lastChild;
    }
    return null;
  }
}

class Choices extends Node {
  constructor(node) {
    super(node);
    this.type = 'choices';
    this.tabstop = Number(this.match[1]);
    this.choices = this.parse(this.match[2]);
    this.focused = this.choices[0];
  }

  focus(n) {
    this.choice = this.choices[n] || '';
  }

  parse(input) {
    let choices = [];
    let choice = '';

    for (let i = 0; i < input.length; i++) {
      let value = input[i];

      if (value === '\\') {
        choice += value + (input[++i] || '');
        continue;
      }

      if (value === '"' || value === '\'') {
        let quote = value;

        while (i < input.length) {
          let ch = input[++i];
          value += ch;

          if (ch === quote) {
            break;
          }
        }
      }

      if (value === ',') {
        choices.push(choice);
        choice = '';
        continue;
      }

      choice += value;
    }

    choices.push(choice);
    return choices;
  }

  compile(options, tabstops) {
    // let opts = { formatters, tabstops: this.tabstops, ...options };
    // let format = opts.formatter[this.type] || opts.default;

    return (context = {}) => {
      let state = { node: this, resolved: 'choice', value: this.focused };

      // if (!this.isValue(state.value)) {
      //   state.resolved = 'choices';
      //   state.value = this.choices;
      // }

      return state.value.replace(/\\(?=[,|])/g, '');
      // return format(state);
    };
  }
}

class Variable extends Node {
  constructor(node) {
    super(node);
    this.type = 'variable';
    this.name = this.match[1];
  }

  compile() {
    return (data = {}) => data[this.name] || '';
  }
}

class Format extends Node {
  constructor(node) {
    super(node);
    this.type = 'format';
  }
}

class Tabstop extends Node {
  constructor(node) {
    super(node);
    this.type = 'tabstop';
    this.tabstop = Number(this.match[2] || this.match[1]);
  }

  placeholder(options) {
    let fields = this.fields.get(this.tabstop);
    let fns = [];

    for (let field of fields) {
      if (field !== this && !field.compiled) {
        field.compiled = true;
        fns.push(field.compile(options));
      }
    }

    return (data, tabstops) => {
      for (let fn of fns) {
        let output = fn(data, tabstops);
        if (output) {
          return output;
        }
      }
    }
  }

  compile(options) {
    let placeholder = this.placeholder(options);

    return (data, tabstops) => {
      let value = tabstops.get(this.tabstop) || placeholder(data, tabstops);
      tabstops.set(this.tabstop, value);
      return value;
    };
  }
}

class VariablePlaceholder extends Block {
  constructor(node) {
    super(node);
    this.type = 'variable_placeholder';
  }

  placeholder(options) {
    let fns = this.innerNodes.map(node => node.compile(options));
    return (data, tabstops) => {
      return fns.map(fn => fn(data, tabstops)).join('');
    };
  }

  compile(options) {
    let placeholder = this.placeholder(options);
    return (data = {}, tabstops) => {
      return data[this.name] || placeholder(data, tabstops);
    }
  }

  get name() {
    return this.nodes[0].match[1];
  }
}

class TabstopPlaceholder extends Block {
  constructor(node) {
    super(node);
    this.type = 'tabstop_placeholder';
  }

  placeholder(options) {
    let fns = this.innerNodes.map(node => node.compile(options));
    return (data, tabstops) => {
      let value = fns.map(fn => fn(data, tabstops)).join('');
      let saved = tabstops.get(this.tabstop);
      if (value !== void 0 && saved === void 0) {
        tabstops.set(this.tabstop, value);
      }
      return value;
    };
  }

  compile(options) {
    let placeholder = this.placeholder(options);

    return (data = {}, tabstops) => {
      let value = tabstops.get(this.tabstop) || placeholder(data, tabstops);
      tabstops.set(this.tabstop, value);
      return value;
    }
  }

  get tabstop() {
    return Number(this.nodes[0].match[1]);
  }
}

class Transform extends Block {
  parse(options) {
    const keys = ['source', 'format', 'flags'];
    const nodes = this.nodes.slice(1, -1);

    let params = { outer: this.stringify(), varname: this.name };
    let type = keys.shift();

    while (nodes.length) {
      let node = nodes.shift();
      if (!node.match && !node.nodes) continue;

      if (node.value === '/' && nodes.length) {
        node = nodes.shift();
        params[(type = keys.shift())] = node.stringify();
        continue;
      }

      if (node.value === '/') {
        continue;
      }

      if (params[type]) {
        params[type] = [].concat(params[type]).concat(node.stringify());
      } else {
        params[type] = node.stringify();
      }
    }

    while (keys.length) {
      params[keys.shift()] = '';
    }

    if (params.flags && !/^[gimuy]+$/.test(params.flags)) {
      params.invalid = true;
      return params;
    }

    if (!params.source) {
      params.source = '$^';
      params.flags = '';
    }

    try {
      params.source = [].concat(params.source).join('');
      params.regexp = new RegExp(params.source, params.flags);
      params.replacers = this.replacers(params.format, options);
    } catch (err) {
      if (!(err instanceof SyntaxError)) {
        throw err;
      }
      params.invalid = true;
      return params;
    }

    return params;
  }

  replacers(format, options = {}) {
    const helpers = { ...builtins, ...options.helpers };

    return [].concat(format).map(str => {
      let match = REGEX_FORMAT_RE.exec(str);
      if (!match) {
        if (str === '/') str = '';
        return { value: str };
      }

      let capture = match[1] || match[2];
      let delim = match[3];
      let operator = match[4] || '';
      let rest = [match[5], match[6]];
      let append = match[7] || '';

      let helperName;
      let helper;
      let elseValue;
      let ifValue;

      if (delim) {
        switch (operator) {
          case '/':
            helperName = rest[0];
            helper = helpers[rest[0]];
            break;
          case '+':
            ifValue = rest[0];
            break;
          case '?':
            if (rest.length !== 2) return str;
            ifValue = rest[0];
            elseValue = rest[1];
            break;
          case '+':
          case '':
          default: {
            elseValue = rest[0];
            break;
          }
        }
      }

      return {
        index: Number(capture),
        helper,
        helperName,
        operator,
        ifValue,
        elseValue,
        append
      };
    });
  }

  transform(options, value, tabstops) {
    let matched = false;
    let output = '';

    // if (!this.params) return this.stringify();
    if (this.params.invalid === true) {
      return this.params.outer;
    }

    let result = value.replace(this.params.regexp, (...args) => {
      args = args.slice(0, -2);
      matched = true;

      for (let replacer of this.params.replacers) {
        if (replacer.value) {
          output += replacer.value;
          continue;
        }

        if (replacer.operator === '+' && args[replacer.index] !== void 0) {
          output += replacer.ifValue;
          continue;
        }

        if (replacer.operator === '?') {
          if (args[replacer.index] !== void 0) {
            output += replacer.ifValue;
          } else {
            output += replacer.elseValue;
          }
          continue;
        }

        if (replacer.operator === '/' && args[replacer.index] !== void 0) {
          output += replacer.helper(args[replacer.index]) || '';
          continue;
        }

        if (args[replacer.index] !== void 0) {
          output += args[replacer.index];
          continue;
        }
      }
    });

    if (matched === false) {
      return '';
    }

    return output;
  }
}

class VariableTransform extends Transform {
  constructor(node) {
    super(node);
    this.type = 'variable_transform';
  }

  compile(options) {
    return (data = {}, tabstops) => {
      let value = data[this.name] || this.name;
      let transform = this.transform(options, value);
      return transform;
    }
  }

  get name() {
    return this.nodes[0].match[1];
  }
}

class TabstopTransform extends Transform {
  constructor(node) {
    super(node);
    this.type = 'tabstop_transform';
  }

  compile(options) {
    return (data = {}, tabstops) => {
      let value = tabstops.get(this.tabstop) || '';
      let transformed = this.transform(options, value);
      tabstops.set(this.tabstop, transformed);
      return transformed;
    }
  }

  get tabstop() {
    return Number(this.nodes[0].match[1]);
  }
}


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
      let char = '';
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

    // if (block.type !== 'root' && value === ':') {
    //   push({ type: 'colon', value });
    //   continue;
    // }

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
