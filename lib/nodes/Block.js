'use strict';

const Node = require('./Node');

class Block extends Node {
  constructor(node = {}) {
    super(node);
    this.type = node.type || 'block';
    this.nodes = [];
  }

  onClose(options) {
    if (this.lastChild) {
      this.loc.end = this.lastChild.loc.end;
    }
  }

  push(node) {
    Reflect.defineProperty(node, 'parent', { value: this });
    this.nodes.push(node);
  }

  inner(method = this.depth > 1 ? 'stringify' : 'inner') {
    return this.nodes.map(node => node[method]()).join('');
  }

  placeholder(data, options) {
    let fns = this.innerNodes.map(node => node.compile(options));
    return fns.map(fn => fn(data)).join('');
  }

  compile(options) {
    let fns = this.nodes.map(node => node.compile(options));

    return data => {
      let value = fns.map(fn => fn(data)).join('');
      let state = { resolved: 'inner', value };
      return this.format(state, options);
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
