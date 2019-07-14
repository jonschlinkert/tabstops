'use strict';

const first = arr => arr.find(v => v !== void 0);
const utils = require('../utils');
const { define } = utils;

class Node {
  constructor(node = {}) {
    this.type = node.type;
    if (node.value) this.value = node.value;
    if (node.nodes) this.nodes = node.nodes;

    define(this, 'parent', node.parent || {});
    define(this, 'match', node.match);

    for (let key of Object.keys(node)) {
      if (!(key in this)) {
        this[key] = node[key];
      }
    }
  }

  inner() {
    return this.nodes ? this.nodes.map(n => n.stringify()).join('') : this.value;
  }

  outer() {
    return String(this.source).slice(...this.loc.range);
  }

  stringify() {
    return this.value || this.nodes.map(n => n.stringify()).join('');
  }

  toSnippet() {
    return this.stringify();
  }

  toTextMateSnippet() {
    return this.stringify();
  }

  push(node) {
    define(node, 'parent', this);
    this.nodes.push(node);
    return node;
  }

  clone() {
    let node = new this.constructor(this);
    if (node.nodes) {
      node.nodes = node.nodes.map(n => n.clone());
    }
    return node;
  }

  find(type) {
    if (this.type === type) {
      return this;
    }

    if (this.nodes) {
      for (let node of this.nodes) {
        let found = node.type === type ? node : node.find(type);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  visit(fn) {
    let value = fn(this);
    if (value === false) return;

    if (this.nodes) {
      for (let node of this.nodes) {
        let val = node.visit(fn);
        if (val === false) {
          break;
        }
      }
    }
  }

  isValue(value) {
    return value !== '' && value !== null && value !== void 0;
  }

  parse() {}

  precompile(options) {
    return this.nodes ? this.nodes.map(node => node.compile(options)) : [];
  }

  compile(options) {
    let fns = this.precompile(options);
    return (locals = {}) => {
      if (this.nodes) {
        return fns.map(fn => fn(locals)).join('');
      }
      if (this.output !== void 0) {
        return this.output;
      }
      return this.value;
    };
  }

  isInside(type) {
    return this.parent && (this.parent.type === type || this.parent.isInside(type));
  }

  append(node) {
    this.value += node.value;
  }

  remove() {
    this.siblings.splice(this.index, 1);
  }

  replace(node) {
    node.type = this.type;
    for (let key of this.keys) {
      if (node[key] === void 0) {
        node[key] = this[key];
      }
    }
    this.siblings.splice(this.index, 1, node);
  }

  condense(fn = () => {}) {
    this.siblings.forEach(fn);
  }

  promote() {
    if (this.siblings.length === 1) {
      this.parent.replace(this);
      this.parent.promote();
      return this.parent;
    }
  }

  demote() {
    if (this.nodes && this.nodes.length === 1) {
      this.replace(this.nodes[0]);
      return this.nodes[0];
    }
  }

  prune(fn) {
    this.condense(fn);
    this.promote();
    this.demote();
  }

  get lastChild() {
    return this.nodes && this.nodes[this.nodes.length - 1];
  }

  get firstChild() {
    return this.nodes && this.nodes[0];
  }

  get siblings() {
    return this.parent.nodes || [];
  }

  get index() {
    return this.siblings.indexOf(this);
  }

  get next() {
    return this.siblings[this.index + 1] || this.parent.next;
  }

  get prev() {
    return this.siblings[this.index - 1] || this.parent.prev;
  }

  get keys() {
    return Object.keys(this).filter(k => k !== 'nodes' && k !== 'type');
  }

  static isNode(value) {
    return value instanceof this;
  }
}

module.exports = Node;
