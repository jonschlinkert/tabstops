'use strict';

const stringify = require('./stringify');

const define = (obj, key, value) => {
  Reflect.defineProperty(obj, key, { value });
};

const parse = (input, options = {}) => {
  console.log('INPUT', [input]);

  const ast = { type: 'root', nodes: [] };
  const stack = [ast];
  let i = 0;

  if (!input) return ast;
  let block, last, node, value;
  let peek = () => input[i + 1];
  let next = () => input[++i];
  let push = (node, parent = block) => {
    define(node, 'parent', parent);

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
        value += next();
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

        let match = matchValue(input.slice(i + 1));
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
            closeBlock(block);
          }
          break;
        }

        push({ type: 'text', value });
        break;

      case ':': {
        if (block.type !== 'tabstop' && block.type !== 'variable') {
          push({ type: 'text', value });
        }
        break;
      }

      case '}': {
        if (block.type === 'tabstop' || block.type === 'variable') {
          closeBlock(block, value);
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

  function closeBlock(block, value) {
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
      node = parse.transform(node.value);
      block.parent.nodes.pop();
      block.parent.nodes.push(node);
    }
  }

  return ast;
};

function isNumber(value) {
  if (typeof value === 'number') {
    return value - value === 0;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return Number.isFinite ? Number.isFinite(+value) : isFinite(+value);
  }
  return false;
}

parse.transform = (input, options = {}) => {
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

  let ast = parse(node.format, options);

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

  node.transform = (locals = {}) => {
    let value = locals[node.varname] || parse.replace(node) || node.placeholder || '';
    if (typeof node.resolve === 'function') {
      return node.resolve(value, locals);
    }
    return value;
  };

  return node;
};

parse.replace = node => {
  node.value = node.value || '';
  node.varname.replace(node.regex, (...args) => {
    let groups = args.slice(0, -2);
    for (let ele of node.groups) {
      if (ele.type === 'text') {
        node.value += ele.value;
      } else {
        node.value += groups[ele.group] || '';
      }
    }
  });
  return node.value;
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

// console.log(matchTransform('TM_FILENAME/(.+)\\.\\/\\}.+|.*/$1/:ComponentName} /Bar/'))
// console.log(matchTransform('TM_FILENAME/(.+)\\..+|.*/$1/:ComponentName} Bar'));
// console.log(matchTransform('TM_FILENAME/(.*)\\..+$/$1/gi} Bar'));
// console.log(matchTransform('TM_FILENAME/(.*)\\}.+$/$1/gi} Bar'));
// console.log(matchTransform('TM_FILENAME/(.*)\\/.+$/$1/gi} Bar'));
// console.log(matchTransform('TM_FILENAME/([a-b]{1,4})\\/.+$/$1/gi} Bar'));
// console.log(matchTransform('TM_FILENAME/(.*)\\..+$/$1/gi} Bar'));
// console.log(matchTransform('TM_FILENAME/(.*)\\}.+$/$1/gi} Bar'));
// console.log(matchTransform('TM_FILENAME/(.*)\\/.+$/$1/gi} Bar'));
// console.log(matchTransform('TM_FILENAME/([a-b]{1,4})\\/.+$/$1/gi} Bar'));
// console.log(matchTransform('foobar\\|foobar/(foo)(bar)/$1_$2/g}'));

// console.log(matchVariable('FOO $BAR'))
// console.log(matchVariable('FOO-BAR $BAR'))
// console.log(matchVariable('FOO_BAR $BAR'))
// console.log(matchVariable('FO1_234 $BAR'))
// console.log(matchTabstop('1 $FOO $BAR'))

// console.log(matchVariable('FOO $BAR'))
// console.log(matchVariable('FOO-BAR $BAR'))
// console.log(matchVariable('FOO_BAR $BAR'))
// console.log(matchVariable('FO1_234 $BAR'))
// console.log(matchValue('1:${2:$FOO}}'))
// console.log(matchValue('foo:${2:$FOO}}'))
// console.log(matchValue('foo}'))

// const format = require('../test/support/format');

// console.log(format(parse('${1:${2}}')));
// console.log(format(parse('${TM_FILENAME:${2}}')));
// console.log(format(parse('$1 $2 $3')));
// console.log(format(parse('foo ${1:bar} baz')));
// console.log(format(parse('foo ${1:${bar:other}} baz')));
// console.log(format(parse('$FOO $BAR')));
// console.log(format(parse('$FOO-BAR $BAR')));
// console.log(format(parse('$FOO_BAR $BAR')));
// console.log(format(parse('$FO1_234 $BAR')));
// console.log(format(parse('$1 $FOO $BAR')));
// console.log(format(parse('ABC ${TM_FILENAME/(.+)\\.\\/\\}.+|.*/$1/gim:ComponentName} /Bar/')));
// console.log(format(parse('ABC ${TM_FILENAME/(.+)\\.\\/\\}.+|.*/$1/:ComponentName} /Bar/')));

module.exports = parse;
