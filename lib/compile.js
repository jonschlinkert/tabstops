'use strict';

const parse = require('./parse');

module.exports = (ast, options = {}) => {
  if (typeof ast === 'string') {
    ast = parse(ast, options);
  }

  const tabstops = {};
  const addTabstop = node => {
    let tabstop = tabstops[node.number];
    if (!tabstop) {
      node.first = true;
      tabstop = tabstops[node.number] = [node];
    } else if (!tabstop.includes(node)) {
      node.first = false;
      tabstop.push(node);
    }
  };

  return (locals = {}, state = {}) => {
    if (!state.tabstops) state.tabstops = tabstops;

    let context = { ...options.variables, ...locals };
    if (options.helpers) {
      context.helpers = { ...options.helpers, ...context.helpers };
    }

    let { variables, helpers } = context;

    const compile = async (ast, parent) => {
      let source = ast.value || '';

      if (ast.type === 'tabstop') {
        addTabstop(ast);
      }

      if (!ast.nodes) {
        return source;
      }

      for (let node of ast.nodes) {
        if (node.type === 'close') continue;
        if (node.type === 'open') continue;

        if (node.type === 'tabstop') {
          addTabstop(node);
        }

        if (typeof node.transform === 'function') {
          source += await node.transform(context, tabstops);
          continue;
        }

        if (node.type === 'text') {
          source += node.value;
          continue;
        }

        if (node.type === 'variable') {
          let orig = node.value;
          node.value = '';

          let value = get(context, orig, get(variables, orig, '')) || compile(node, ast);
          if (value && value === node.value) {
            continue;
          }

          source += ((await value) || node.placeholder || '');
          continue;
        }

        if (node.placeholder) {
          let key = node.placeholder;
          let value = get(context, key) || get(variables, key) || get(helpers, key, key);

          if (typeof value === 'function') {
            source += await value(context);
            continue;
          }

          source += value;
        }

        if (node.nodes) {
          source += await compile(node);
          continue;
        }
      }

      return source;
    };

    return compile(ast);
  };
};

function get(obj = {}, prop = '', fallback) {
  let value = obj[prop] == null
    ? prop.split('.').reduce((acc, k) => acc && acc[k], obj)
    : obj[prop];
  return value == null ? fallback : value;
}
