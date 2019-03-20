'use strict';

const parse = require('./parse');
const variables = require('./variables');

module.exports = async(ast, options = {}) => {
  if (typeof ast === 'string') {
    ast = await parse(ast, options);
  }

  const addTabstop = (node, state) => {
    let tabstop = state.tabstops[node.number];
    if (!tabstop) {
      node.first = true;
      tabstop = state.tabstops[node.number] = [node];
    } else if (!tabstop.includes(node)) {
      node.first = false;
      tabstop.push(node);
    }
  };

  return async(locals = {}, state = {}, resolve = val => val) => {
    if (!state.tabstops) state.tabstops = {};

    let vars = variables(state, options);
    let context = { ...options.variables, ...locals };

    if (options.helpers) {
      context.helpers = { ...options.helpers, ...context.helpers };
    }

    /**
     * Compile a Variable
     */

    const compileVariable = async(node, parent) => {
      let key = node.value;
      node.value = '';

      let val = get(context, key, get(context.variables, key, get(vars, key, await compile(node, parent))));
      let helper = get(context.helpers, key);
      let value = [val, node.placeholder].find(v => v != null && v !== '') || '';

      if (helper) {
        value = await helper(value);
      }

      return resolve(value, key, node, parent);
    };

    /**
     * Compile a Placeholder
     */

    const compilePlaceholder = async(node, parent) => {
      let val = node.placeholder;
      let value = get(context, val, val);

      if (typeof value === 'function') {
        value = await value(context, node, parent);
      }

      let helper = get(context.helpers, val, get(context.helpers, value));
      if (helper) {
        value = await helper(value);
      }

      return resolve(value, value, node, parent);
    };

    /**
     * Compile AST nodes
     */

    const compile = async ast => {
      let source = ast.value || '';

      if (!ast.nodes) return source;
      if (ast.type === 'tabstop') {
        addTabstop(ast, state);
      }

      for (let node of ast.nodes) {
        if (node.type === 'close') continue;
        if (node.type === 'open') continue;
        if (node.type === 'tabstop') addTabstop(node, state);

        if (typeof node.transform === 'function') {
          source += await node.transform(context, state.tabstops);
          continue;
        }

        if (node.type === 'text') {
          source += node.value;
          continue;
        }

        if (node.type === 'variable') {
          source += await compileVariable(node, ast);
          continue;
        }

        if (node.placeholder) {
          source += await compilePlaceholder(node, ast);
        }

        if (node.nodes) {
          source += await compile(node);
        }
      }

      return source;
    };

    return compile(await ast);
  };
};

function get(obj = {}, prop = '', fallback) {
  if (!prop) return;
  let value = obj[prop] == null
    ? prop.split('.').reduce((acc, k) => acc && acc[k], obj)
    : obj[prop];
  return value == null ? fallback : value;
}
