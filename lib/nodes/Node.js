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

    if (node.history) {
      this.history = node.history.slice();
    }

    for (let key of Object.keys(node)) {
      if (!(key in this)) {
        this[key] = node[key];
      }
    }

    define(this, 'history', this.history || []);
  }

  push(node) {
    define(node, 'parent', this);
    this.nodes.push(node);
    return node;
  }

  clone() {
    return new this.constructor(this);
  }

  stringify(fn = node => first([node.output, node.value, ''])) {
    let output = '';
    this.visit(node => (output += fn(node)));
    return output;
  }

  visit(fn) {
    fn(this);
    this.nodes && this.nodes.forEach(node => node.visit(fn));
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

  inner(input) {
    return this.value || input.slice(...this.range);
  }

  get innerNodes() {
    if (this.nodes) {
      return this.nodes.filter(node => {
        return !node.type.startsWith('open_') && !node.type.startsWith('close_');
      });
    }
  }

  get range() {
    return [this.loc.start, this.loc.end];
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
