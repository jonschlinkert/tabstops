'use strict';

const mapVisit = (node, fn) => {
  for (let child of node.nodes) visit(child, fn);
  return node;
};

const visit = (node, fn) => {
  fn(node);
  return node.nodes ? mapVisit(node, fn) : node;
};

const compile = ast => {
  let source = '';
  let state = {};

  visit(ast, node => {
    if (node.type === 'tabTrigger') {
      // state.tabTrigger = node.nodes.find(n => n.type === 'text');
      // node.nodes = [];
    }

    if (node.type === 'template') {
    }
      // console.log(node)
  });

  return context => {
    let keys = [];
    let vals = [];

    for (let key in context) {
      if (context.hasOwnProperty(key)) {
        keys.push(key);
        vals.push(context[key]);
      }
    }

    return Function(keys, `return \`${source}\``).apply(context, vals);
  };
};

module.exports = compile;
