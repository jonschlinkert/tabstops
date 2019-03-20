'use strict';

const define = (obj, key, value) => {
  Reflect.defineProperty(obj, key, { value });
};

const clean = (str = '') => {
  return typeof str === 'string' ? str.replace(/^['"]|['"]$/g, '') : '';
};

class Item {
  constructor(token) {
    this.name = token.key;
    this.field = token.field || {};
    this.value = clean(token.initial || this.field.initial || '');
    this.message = token.message || this.name;
    this.cursor = 0;
    this.index = 0;
    this.input = '';
    this.lines = [];
  }
}

const parse = async(input, options = {}) => {
  if (typeof input !== 'string') {
    return Promise.reject(new TypeError('Expected input to be a string'));
  }

  const ast = { type: 'root', nodes: [] };
  const fields = options.fields || {};
  const stack = [ast];
  const tokens = [];
  const items = [];
  const state = { loc: { index: 0, line: 1, column: 0 }, tabstops: {} };

  let delimiters = [].concat(options.delimiters || ['$', '#']);
  let separators = [].concat(options.separators || [':', '=']);
  let last, nextChar, node, match, val, value, quote;
  let block = ast;
  let prev = ast;

  let peek = n => input[state.loc.index + (n || 1)];
  let advance = () => input[++state.loc.index];

  let push = (node, parent = block) => {
    if (options.lines) node.line = state.loc.line;
    if (last && last.type === 'text' && node.type === 'text') {
      last.value += node.value;
    } else {
      define(node, 'parent', parent);
      define(node, 'prev', prev);
      define(prev, 'next', node);
      parent.nodes.push(node);
      prev = node;
    }
  };

  for (; state.loc.index < input.length; state.loc.index++) {
    value = input[state.loc.index];
    block = stack[stack.length - 1];
    last = block.nodes ? block.nodes[block.nodes.length - 1] : block;

    switch (value) {
      case '\\':
        if (/^\\(?:[1-7][0-7]{0,2}|[0-7]{2,3})/.test(input.slice(state.loc.index))) {
          return Promise.reject(new SyntaxError('Octal escape sequences are not allowed'));
        }

        value += advance() || '';
        push({ type: 'text', value });
        break;

      case '\'':
      case '"':
        if (block.type === 'root') {
          push({ type: 'text', value });
          break;
        }

        quote = value;

        while (val !== value && ((val = peek()) !== quote) && val) {
          val = advance();
          if (val === '\\') val += advance();
          value += val;
        }

        if (options.preserveQuotes === false) {
          advance();
          push({ type: 'text', value: value.slice(1) });
        } else {
          value += advance();
          push({ type: 'text', value });
        }

        break;

      case '\n':
        state.loc.line++;
        push({ type: 'text', value });
        break;

      case '#':
      case '$':
        if (!delimiters.includes(value)) {
          push({ type: 'text', value });
          break;
        }

        nextChar = peek();

        if (nextChar !== '{' && !isValidVariableOrTabstopChar(nextChar)) {
          push({ type: 'text', value });
          break;
        }

        if (!isValidVariableOrTabstopChar(peek(2))) {
          push({ type: 'text', value });
          break;
        }

        if (nextChar === '{') {
          advance();
          node = { type: 'tabstop', nodes: [] };
          push(node);
          stack.push(node);
          block = node;
        }

        match = matchValue(input.slice(state.loc.index + 1));
        if (match) {
          state.loc.index += match.value.length;
          if (match.type === 'stop' && block.type !== 'tabstop') {
            match = { type: 'tabstop', number: Number(match.value), nodes: [] };
          }

          push(match);

          let choices = matchChoices(input.slice(state.loc.index + 1));
          if (choices) {
            last = block.nodes[block.nodes.length - 1];
            state.loc.index += choices.value;
            if (last && last.type === 'stop' && last.value !== '0') {
              push(choices);
            }
            await closeBlock(block, options);
          }
          break;
        }

        push({ type: 'text', value });
        break;

      case ':':
      case '=':
        if (!separators.includes(value) || block.type === 'root' || block.nodes.length > 1) {
          push({ type: 'text', value });
        }
        break;

      case '}':
        if (block.type === 'tabstop' || block.type === 'variable') {
          await closeBlock(block, options);
          break;
        }
        push({ type: 'text', value });
        break;

      default: {
        push({ type: 'text', value });
        break;
      }
    }
  }

  async function closeBlock(block, options) {
    block = stack.pop();
    node = block.nodes.shift();

    if (last && last.type === 'text' && block.nodes.length === 1) {
      block.placeholder = last.value;
      block.nodes = [];
    }

    if (node.type === 'stop') {
      block.type = 'tabstop';
      block.number = Number(node.value);
      return;
    }

    if (node.type === 'text' || (node.type === 'variable' && !node.nodes)) {
      block.type = 'variable';
      block.value = node.value;
    } else if (node.value) {
      node = await parse.transform(node.value, options);
      block.parent.nodes.pop();
      block.parent.nodes.push(node);
    }
  }

  return ast;
};

parse.transform = async(input, options = {}) => {
  const tokens = [];

  let node = { type: 'transform', value: input };
  let last, value;
  let i = 0;
  let advance = () => input[++i];

  let sections = ['varname', 'regex', 'format', 'flags', 'placeholder'];
  let type = sections.shift();

  let push = token => {
    if (last && last.type === type && token.type === type) {
      last.value += token.value;
    } else {
      tokens.push(token);
    }
  };

  for (; i < input.length; i++) {
    value = input[i];
    last = tokens[tokens.length - 1];

    if (type === 'flags' && !/[gimuy]/.test(value)) {
      if (!tokens.some(tok => tok.type === 'flags')) {
        tokens.push({ type: 'flags', value: '' });
      }
      type = sections.shift();
    }

    switch (value) {
      case '\\':
        value += advance();
        push({ type, value });
        break;
      case '/':
        type = sections.shift();
        if (type) {
          push({ type, value: '' });
        }
        break;
      default: {
        if (type === 'placeholder' && value === ':') {
          value = '';
        }
        push({ type, value });
        break;
      }
    }
  }

  for (let tok of tokens) {
    node[tok.type] = tok.value;
  }

  node.regex = new RegExp(node.regex, node.flags);
  let res = await parse(node.format, options);

  node.nodes = res.nodes.map(child => {
    if (child.nodes && !child.nodes.length) {
      delete child.nodes;
    }
    return child;
  });

  node.transform = async(locals = {}, tabstops = {}) => {
    let value = await parse.replace(node, locals, tabstops) || '';
    if (typeof node.resolve === 'function') {
      return await node.resolve(value, locals, tabstops);
    }
    return value;
  };

  return node;
};

parse.replace = async(node, context, tabstops) => {
  const compile = require('./compile');
  let helpers = context.helpers || {};
  let value = '';
  let variable = tabstops[node.varname] ? tabstops[node.varname][0] : '';
  if (variable) {
    variable = (await (await compile(variable))(context)) || variable.placeholder;
  }

  if (!variable) {
    variable = !isNumber(node.varname)
      ? get(context, node.varname) || get(context.variables, node.varname, node.varname)
      : '';
  }

  await replace(variable, node.regex, async(...args) => {
    for (let ele of node.nodes) {
      let helper = ele.placeholder ? helpers[ele.placeholder] : null;
      let val = '';

      if (ele.type === 'variable') {
        val = get(context, ele.value) || get(context.variables, ele.value) || ele.value;
      } else if (ele.type === 'text') {
        val = ele.value;
      } else {
        val = args[ele.number] || '';
      }

      if (val && helper) {
        val = helper(val);
      }

      value += await val;
    }
    return args[0];
  });

  return value;
};

function matchValue(str) {
  let transform = matchTransform(str);
  if (transform) {
    return transform;
  }

  let tabstop = matchTabstop(str);
  if (tabstop) {
    return tabstop;
  }

  let variable = matchVariable(str);
  if (variable) {
    return variable;
  }

  let regex = /^([_\w.]+)/;
  let match = regex.exec(str);
  if (match) {
    let value = match[0];
    let type = (match[1].length === 1 && isNumber(match[1])) ? 'stop' : 'variable';
    return { type, value };
  }
}

function matchChoices(str) {
  let regex = /^\|(.+)\|(?=})/;
  let match = regex.exec(str);
  if (match) {
    let [value, choices] = match;
    return { type: 'choices', value, choices: choices.split(/(?<!\\)[,|]/) };
  }
}

function isValidVariableOrTabstopChar(str) {
  return /^[\w$ ]/.test(str);
}

function matchTabstop(str) {
  let regex = /^([0-9])(?=[:| }]|$)/;
  let match = regex.exec(str);
  if (match) {
    let [value, tabstop] = match;
    return { type: 'stop', value, tabstop };
  }
}

function matchVariable(str) {
  let regex = /^[_a-zA-Z][_a-zA-Z0-9.]*/;
  let match = regex.exec(str);
  if (match) {
    return { type: 'variable', value: match[0] };
  }
}

function matchTransform(str) {
  let regex = /^(?!\w+:)((?:\\.|{[^}]+}|[^}])+(?<!\\)\/)([gimuy]*):?([^}]*)(?=})/;
  let match = regex.exec(str);
  if (match) {
    let [value, regex, options, placeholder] = match;
    return { type: 'transform', value, regex, options, placeholder };
  }
}

function get(obj = {}, prop = '', fallback) {
  let value = obj[prop] == null
    ? prop.split('.').reduce((acc, k) => acc && acc[k], obj)
    : obj[prop];
  return value == null ? fallback : value;
}

async function replace(str, regex, fn) {
  let match;
  let i = 0;
  while (i < str.length && (match = regex.exec(str.slice(i)))) {
    str.replace(regex, await fn(...match));
    i += match[0].length;
  }
  return str;
}

function isNumber(value) {
  if (typeof value === 'number') {
    return value - value === 0;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return Number.isFinite ? Number.isFinite(+value) : isFinite(+value);
  }
  return false;
}

module.exports = parse;
