'use strict';

const colors = require('ansi-colors');
const Compiler = require('./compiler');
const styles = require('./styles');
const parse = require('./parse');
const utils = require('./utils');

module.exports = (ast, options = {}) => {
  const compiler = new Compiler(options);
  const placeholders = options.placeholders || options.debug;
  const isValue = options.isValue || (val => val != null && val !== '');
  const metadata = { tabTrigger: '', scope: '', description: '' };
  const debug = styles(options);

  if (typeof ast === 'string') {
    ast = parse(ast, options);
  }

  compiler.handler('open', () => {});
  compiler.handler('close', () => {});
  compiler.handler('text', node => node.value);
  compiler.handler('root', (node, context, state) => {
    return compiler.mapVisit(node.nodes, context, state);
  });

  compiler.handler('tag', (node, context, state) => {
    let value = compiler.mapVisit(node.nodes, context, state);
    if (metadata.hasOwnProperty(node.name)) {
      metadata[node.name] = value;
      return;
    }
    return value;
  });

  compiler.handler('template', (node, context, state) => {
    if (node.render === false) {
      delete node.render;
      return '';
    }

    return compiler.mapVisit(node.nodes, context, state);
  });

  compiler.handler('variable', (node, context = {}, state) => {
    let idx = node.parent.nodes.indexOf(node);
    let nextSibling = node.parent.nodes[idx + 1];
    let nextValue;

    console.log(node.parent)

    if (nextSibling && nextSibling.type === 'template') {
      nextValue = compiler.visit(nextSibling, context, state);
      nextSibling.render = false;

      if (options.debug && isValue(nextValue, node)) {
        nextValue = debug.warning(colors.unstyle(nextValue));
      }
    }

    let key = placeholders === true ? debug.info(`<${node.key}>`) : '';
    node.placeholder = key;

    if (node.parent.parent.type !== 'root') {
      key = void 0;
    }

    let values = [context[node.key], utils.get(context, node.key), node.value, nextValue, key];
    let value = values.find(v => isValue(v, node));

    if (node.helper) {
      value = node.helper(value, node, context);
    }

    // if (!value && nextValue) {
    //   value += nextValue;
    // }

    // if (compiler.options.finalRender && value.includes(node.placeholder)) {
    //   value = colors.unstyle(value.split(node.placeholder).join(''));
    // }

    // console.log('node.value', [node.value])
    // console.log('next value', [nextValue])
    // console.log('     value', [value])
    // console.log('---')

    if (value === node.value) {
      return debug.danger(value);
    }

    if (isValue(value, node)) {
      return debug.success(value);
    }

    return value;
  });

  return compiler.compile(ast);
};
