'use strict';

const kOutput = Symbol('output');
const formatters = require('../formatters');
const debug = require('../debug');
const { define } = require('../utils');

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

    define(this, 'string', '');
    define(this, 'debug', debug(this.constructor.name));
    debug.spy(this);
  }

  push(node) {
    define(node, 'parent', this);
    this.nodes.push(node);
    return node;
  }

  append(node) {
    if (node && this.match && this.loc) {
      this.match[0] += node.match[0];
      this.value += node.value;
      this.loc.end = node.loc.end;
    }
  }

  toString() {
    let output = '';
    if (this.nodes) {
      for (let node of this.nodes) {
        output += node.toString();
      }
    } else if (this.match) {
      output += this.match[0];
    }
    return output;
  }

  stringify() {
    return this.toString();
    // return this.value || (this.nodes ? this.nodes.map(n => n.stringify()).join('') : '');
  }

  toSnippet() {
    return this.stringify();
  }

  toTextMateSnippet() {
    return this.stringify();
  }

  inner() {
    let output = this.stringify();
    if (this.parent.type === 'root' && this.openNode && this.closeNode) {
      return output.slice(2, -1);
    }
    return output;
  }

  outer() {
    return String(this.root.source).slice(...this.loc.range);
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
      return this.output;
    };
  }

  isInside(type) {
    return this.parent && (this.parent.type === type || this.parent.isInside(type));
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

  set output(value) {
    this[kOutput] = value;
  }
  get output() {
    return typeof this[kOutput] === 'string' ? this[kOutput] : this.value;
  }

  get openNode() {
    if (this.firstChild && this.firstChild.type === 'open_brace') {
      return this.firstChild;
    }
    return null;
  }

  get closeNode() {
    if (this.lastChild && this.lastChild.type === 'close_brace') {
      return this.lastChild;
    }
    return null;
  }

  get firstChild() {
    return this.nodes && this.nodes[0];
  }

  get lastChild() {
    return this.nodes && this.nodes[this.nodes.length - 1];
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
