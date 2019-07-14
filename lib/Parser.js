'use strict';

const Events = require('events');
const errors = require('./errors');
const Lexer = require('./Lexer');
const Scope = require('./Scope');
const Node = require('./nodes/Node');
const { define } = require('./utils');

const assert = (value, message) => {
  if (!value) {
    throw new Error(message);
  }
};

class Parser extends Events {
  constructor(input) {
    super();
    this.lexer = new Lexer(input);
    this.loc = this.lexer.location();
    this.ast = new Node({ type: 'root', nodes: [], });
    this.scope = new Scope({ type: 'root' });
    this.handlers = new Map();
    this.block = this.ast;
    this.stack = [this.ast];
    this.scopes = [this.scope];
    this.prev = null;
  }

  handler(name, fn) {
    this.handlers.set(name, fn);
    return this;
  }

  isInside(type, node) {
    if (node) return node.isInside(type);
    if (!type) return this.stack.length > 1;
    if (Array.isArray(type)) return type.some(t => this.isInside(t));
    return this.stack.some(n => n.type === type);
  }

  isInsideScope(type) {
    if (!type) return this.scope.type !== 'root';
    if (Array.isArray(type)) return type.some(t => this.isInsideScope(t));
    return this.scope.type === type || this.scope.isInside(type);
  }

  lookbehind(...args) {
    return this.lexer.lookbehind(...args);
  }

  lookahead(...args) {
    return this.lexer.lookahead(...args);
  }

  peek() {
    return this.lexer.peek();
  }

  capture(...args) {
    return this.lexer.capture(...args);
  }

  expect(type) {
    let node = this.next();
    assert(node.type === type, `Expected "${type}", but received "${node.type}"`);
    return node;
  }

  accept(type) {
    let node = this.peek();
    if (node.type === type) {
      return this.next();
    }
  }

  pushScope(scope) {
    define(scope, 'parent', this.scope);
    this.scopes.push(scope);
    this.scope = scope;
  }

  popScope(scope) {
    this.scopes.pop();
    this.scope = this.scopes[this.scopes.length - 1];
  }

  push(node) {
    if (!node) return;
    if (node === null) return;

    this.emit('push', node);

    if (this.prev && this.prev.type === 'text' && node.type === 'text') {
      this.prev.value += node.value;
      this.prev.loc.end = node.loc.end;
      return;
    }

    let block = this.block = this.stack[this.stack.length - 1];
    if (!(node instanceof Node)) {
      node = new Node(node);
    }

    block.source = node.source = Buffer.from(this.lexer.source);
    block.push(node);

    if (node.nodes) {
      this.stack.push(node);
      this.block = node;
    }

    if (node.close === true) {
      block = this.pop();
    }

    this.prev = node;
    return node;
  }

  pop() {
    let scope = this.scopes[this.scopes.length - 1];
    let block = this.stack.pop();
    block.loc.end = block.lastChild.loc.end;

    if (scope.blocks[0] === block) {
      this.popScope();
    }

    this.block = this.stack[this.stack.length - 1];
    return block;
  }

  scan(token) {
    for (let [, handler] of this.handlers) {
      let node = handler(token);
      if (node) {
        return node;
      }
    }
  }

  handle(token) {
    let handler = this.handlers.get(token.type);
    if (handler) {
      let node = handler(new Node(token));
      if (node === true) return;
      return this.push(node);
    }
    this.fail(token, 'MISSING_HANDLER');
  }

  next() {
    let token = this.lexer.next();
    if (token) {
      this.lexer.push(token);
      return this.handle(token);
    }
  }

  parse() {
    while (!this.lexer.eos()) this.next();
    return this.loc(this.ast);
  }

  fail(node, code) {
    throw new SyntaxError(`${code}: ${errors[code](node)}`);
  }
}

module.exports = Parser;
