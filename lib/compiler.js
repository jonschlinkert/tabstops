'use strict';

class Compiler {
  constructor(options = {}) {
    this.options = { ...options };
    this.handlers = { ...options.handlers };
    this.data = { ...options.data };
  }

  append(value) {
    return value;
  }

  handler(type, fn) {
    this.handlers[type] = fn;
    return this;
  }

  visit(node, context, state) {
    let fn = this.handlers[node.type];
    let helper = this.helpers[node.key];

    if (typeof fn !== 'function') {
      throw new TypeError(`expected handler for "${node.type}" to be a function`);
    }

    if (typeof helper === 'function') {
      node.helper = helper.bind(this);
    }
    return this.append(fn(node, context, state) || '', node);
  }

  mapVisit(nodes, context, state) {
    let source = '';
    for (let node of nodes) source += this.visit(node, context, state);
    return source;
  }

  compile(ast, options = {}) {
    this.options = { ...this.options, ...options };
    this.helpers = { ...this.options.helpers, ...options.helpers };

    return (locals, state) => {
      return this.mapVisit(ast.nodes, { ...this.data, ...locals }, state);
    };
  }
}

module.exports = Compiler;
