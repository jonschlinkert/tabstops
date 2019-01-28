'use strict';

const stringify = ast => {
  let output = '';

  for (let node of ast.nodes) {
    if (node.choices) output += '|' + node.choices + '|';
    if (node.value) {
      output += node.value;
    } if (node.open || node.close) {
      output += (node.open || node.close);
    } else if (node.placeholder) {
      output += node.placeholder;
    } else if (node.transform) {
      output += node.nodes[0].value + node.transform + node.nodes[node.nodes.length - 1].value;
    } else if (node.nodes) {
      output += stringify(node);
    }
  }

  return output;
};

module.exports = stringify;
