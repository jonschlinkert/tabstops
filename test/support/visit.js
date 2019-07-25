'use strict';

const visit = (node, fn) => {
  let newNode = fn(node);

  if (node.nodes) {
    node.nodes = node.nodes.map(n => visit(n, fn));
  }

  return newNode || node;
};

module.exports = visit;
