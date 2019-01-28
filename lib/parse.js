'use strict';

const stringify = require('./stringify');

const define = (obj, key, value) => {
  Reflect.defineProperty(obj, key, { value });
};

const parse = async (input, options = {}) => {
  const ast = { type: 'root', nodes: [] };
  const stack = [ast];
  let line = 1;
  let i = 0;

  if (!input) return ast;

  let block, last, node, match, val, value, quote;
  let peek = () => input[i + 1];
  let next = () => input[++i];
  let push = (node, parent = block) => {
    define(node, 'parent', parent);
    if (options.lines) node.line = line;
    if (last && last.type === 'text' && node.type === 'text') {
      last.value += node.value;
    } else {
      parent.nodes.push(node);
    }
  };

  for (; i < input.length; i++) {
    value = input[i];
    block = stack[stack.length - 1];
    last = block.nodes ? block.nodes[block.nodes.length - 1] : block;

    switch (value) {
      case '\\':
        push({ type: 'text', value: value + (next() || '') });
        break;

      case '\'':
      case '"':
        quote = value;

        while (val !== value && ((val = peek()) !== quote) && val) {
          val = next();
          if (val === '\\') {
            val += next();
          }
          value += val;
        }

        next();
        push({ type: 'text', value: value.slice(1) });
        break;

      case '\n':
        line++;
        push({ type: 'text', value });
        break;

      case '$':
        if (peek() === '{') {
          next();
          node = { type: 'tabstop', nodes: [] };
          push(node);
          stack.push(node);
          block = node;
        }

        match = matchValue(input.slice(i + 1));
        if (match) {
          i += match.value.length;
          if (match.type === 'stop' && block.type !== 'tabstop') {
            match = { type: 'tabstop', number: Number(match.value), nodes: [] };
          }

          push(match);

          let choices = matchChoices(input.slice(i + 1));
          if (choices) {
            last = block.nodes[block.nodes.length - 1];
            i += choices.value;
            if (last && last.type === 'stop' && last.value !== '0') {
              push(choices);
            }
            await closeBlock(block, options);
          }
          break;
        }

        push({ type: 'text', value });
        break;

      case ':': {
        if ((block.type !== 'tabstop' && block.type !== 'variable') || block.nodes.length > 1) {
          push({ type: 'text', value });
        }
        break;
      }

      case '}': {
        if (block.type === 'tabstop' || block.type === 'variable') {
          await closeBlock(block, options);
          break;
        }
        push({ type: 'text', value });
        break;
      }

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

parse.transform = async (input, options = {}) => {
  const tokens = [];

  let node = { type: 'transform', value: input };
  let last, value;
  let i = 0;
  let next = () => input[++i];

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

    if (type === 'flags' && !/[gmiy]/.test(value)) {
      if (!tokens.some(tok => tok.type === 'flags')) {
        tokens.push({ type: 'flags', value: '' });
      }
      type = sections.shift();
    }

    switch (value) {
      case '\\':
        value += next();
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
  let ast = await parse(node.format, options);

  node.groups = ast.nodes.map(child => {
    let result = child;

    if (result.type === 'tabstop') {
      result = { type: 'match', group: result.number };
    }
    if (result.type === 'variable') {
      result = { type: 'variable', value: result.value };
    }

    if (child.placeholder) {
      result.placeholder = child.placeholder;
    }

    if (child.nodes && child.nodes.length) {
      result.nodes = child.nodes;
    }
    return result;
  });

  node.transform = async (locals = {}, tabstops = {}) => {
    let value = await parse.replace(node, locals, tabstops) || '';
    if (typeof node.resolve === 'function') {
      return await node.resolve(value, locals, tabstops);
    }
    return value;
  };

  return node;
};

parse.replace = async (node, context, tabstops) => {
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

  await replace(variable, node.regex, async (...args) => {
    for (let ele of node.groups) {
      let helper = ele.placeholder ? helpers[ele.placeholder] : null;
      let val = '';

      if (ele.type === 'variable') {
        val = get(context, ele.value) || get(context.variables, ele.value) || ele.value;
      } else if (ele.type === 'text') {
        val = ele.value;
      } else {
        val = args[ele.group] || '';
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

  let regex = /^([_\w]+)/;
  let match = regex.exec(str);
  if (match) {
    let value = match[0];
    let type = isNumber(match[1]) ? 'stop' : 'variable';
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

function matchTabstop(str) {
  let regex = /^([0-9]+)(?=[:| }]|$)/;
  let match = regex.exec(str);
  if (match) {
    let [value, tabstop] = match;
    return { type: 'stop', value, tabstop };
  }
}

function matchVariable(str) {
  let regex = /^([_a-zA-Z][_a-zA-Z0-9]*)/;
  let match = regex.exec(str);
  if (match) {
    let [value, variable] = match;
    return { type: 'variable', value };
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
