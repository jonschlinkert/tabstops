'use strict';

const colors = require('ansi-colors');
const Compiler = require('./compiler');
const parse = require('./parse');
const utils = require('./utils');

module.exports = (ast, options = {}) => {
  let compiler = new Compiler(options);
  let isValue = options.isValue || (val => val != null && val !== '');
  let metadata = { tabTrigger: '', scope: '', description: '' };

  if (typeof ast === 'string') {
    ast = parse(ast, options);
  }

  compiler.handler('open', () => {});
  compiler.handler('close', () => {});
  compiler.handler('text', node => node.value);
  compiler.handler('root', (node, context) => {
    return compiler.mapVisit(node.nodes, context);
  });

  compiler.handler('tag', (node, context) => {
    let value = compiler.mapVisit(node.nodes, context);
    if (metadata.hasOwnProperty(node.name)) {
      metadata[node.name] = value;
      return;
    }
    return value;
  });

  compiler.handler('template', (node, context) => {
    if (node.render === false) {
      delete node.render;
      return '';
    }
    return compiler.mapVisit(node.nodes, context);
  });

  compiler.handler('variable', (node, context = {}) => {
    let idx = node.parent.nodes.indexOf(node);
    let sibling = node.parent.nodes[idx + 1];
    let nextValue;

    if (sibling.type === 'template') {
      nextValue = compiler.visit(sibling, context);
      sibling.render = false;

      if (isValue(nextValue, node)) {
        nextValue = colors.yellow(colors.unstyle(nextValue));
      }
    }

    let key = colors.cyan(`<${node.key}>`);
    if (node.parent.parent.type !== 'root') {
      key = void 0;
    }

    let fallback = [node.value, nextValue, key].find(v => isValue(v, node));
    let value = utils.get(context, node.key);

    if (!isValue(value, node)) {
      value = fallback;
    }

    if (compiler.helpers[node.key]) {
      value = compiler.helpers[node.key](value, node);
    }

    if (value === node.value) {
      return colors.magenta(value);
    }

    if (isValue(value, node)) {
      return colors.green(value);
    }
    return value;
  });

  return compiler.compile(ast);
};
