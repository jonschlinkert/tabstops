'use strict';

const Node = require('./Node');

class Block extends Node {
  constructor(node = {}) {
    super(node);
    this.nodes = [];
  }

  push(node) {
    Reflect.defineProperty(node, 'parent', { value: this });
    this.nodes.push(node);
  }

  compile(options) {
    let fns = this.nodes.map(node => node.compile(options));
    return (data, tabstops) => {
      let value = fns.map(fn => fn(data, tabstops)).join('');
      if (value !== void 0 && this.tabstop !== void 0) {
        tabstops.set(this.tabstop, value);
      }
      return value;
    };
  }

  get innerNodes() {
    return (this.openNode && this.closeNode) ? this.nodes.slice(1, -1) : this.nodes;
  }
  get firstChild() {
    return this.nodes[0];
  }
  get lastChild() {
    return this.nodes[this.nodes.length - 1];
  }
  get openNode() {
    if (this.firstChild && this.firstChild.type === 'open') {
      return this.firstChild;
    }
    return null;
  }
  get closeNode() {
    if (this.lastChild && this.lastChild.type === 'close') {
      return this.lastChild;
    }
    return null;
  }
}

module.exports = Block;
