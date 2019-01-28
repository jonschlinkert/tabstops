'use strict';

const parse = require('./parse');

module.exports = (ast, options) => {
  if (typeof ast === 'string') {
    ast = parse(ast, { collate: true, ...options });
  }

  return (locals = {}) => {
    const compile = ast => {
      let source = '';

      for (let node of ast.nodes) {
        if (node.type === 'close') continue;
        if (node.type === 'open') continue;

        // console.log(node)
        if (typeof node.transform === 'function') {
          source += node.transform(locals);
        }

        if (node.type === 'text') {
          source += node.value;
          continue;
        }

        if (node.placeholder) {
          let key = node.placeholder;
          let value = locals[key] || (locals.helpers && locals.helpers[key]) || key;
          if (typeof value === 'function') {
            source += value(locals);
            continue;
          }

          source += value;
        }

        if (node.nodes) {
          source += compile(node);
          continue;
        }
      }

      return source;
    };

    return compile(ast);
  };
};
