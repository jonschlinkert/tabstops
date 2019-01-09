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

  visit(node, context) {
    let fn = this.handlers[node.type];
    if (typeof fn !== 'function') {
      throw new TypeError(`expected handler for "${node.type}" to be a function`);
    }
    return this.append(fn(node, context) || '', node);
  }

  mapVisit(nodes, context) {
    let source = '';
    for (let node of nodes) source += this.visit(node, context);
    return source;
  }

  compile(ast, options = {}) {
    this.options = { ...this.options, ...options };
    this.helpers = { ...this.options.helpers, ...options.helpers };

    return locals => {
      return this.mapVisit(ast.nodes, { ...this.data, ...locals });
    };
  }
}

module.exports = Compiler;
