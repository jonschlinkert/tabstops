'ue strict';

const kDepth = Symbol('depth');
const formatters = require('../formatters');

class Node {
  constructor(node) {
    this.type = node.type;

    for (let key of Object.keys(node)) {
      if (!(key in this)) {
        this[key] = node[key];
      }
    }

    if (this.match && !this.value) {
      this.value = this.match[0];
    }

    if (this.value && !this.match) {
      this.match = [this.value];
    }
  }

  format(state, options) {
    let opts = { formatters, ...options };
    let type = this.type;

    if (type === 'root') {
      return state.value;
    }

    if (type === 'open' || type === 'close') {
      type = 'text';
    }

    let format = opts.formatters[type];
    if (typeof format !== 'function') {
      throw new TypeError(`Expected formatter "${type}" to be a function`);
    }

    return format(state);
  }

  clone() {
    let node = new this.constructor(this);
    if (node.nodes) {
      node.nodes = node.nodes.map(n => n.clone());
    }
    return node;
  }

  append(node) {
    if (node && this.value && this.match) {
      this.match[0] += node.value;
      this.value += node.value;
    }
    if (node && node.loc && this.loc) {
      this.loc.end = node.loc.end;
    }
  }

  replace(node) {
    this.siblings[this.index] = node;
    node.parent = this.parent;
  }

  remove() {
    this.siblings.splice(this.index, 1);
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

  inner() {
    return this.match ? this.match[0] : '';
  }

  compile(options) {
    return () => {
      let state = { node: this, resolved: 'value', value: this.value };
      return this.format(state);
    }
  }

  render(data, options) {
    return this.compile(options)(data);
  }

  stringify() {
    if (this.nodes) {
      return this.nodes.map(node => node.stringify()).join('');
    }
    if (this.match && !this.nodes) {
      return this.match[0];
    }
    return this.value || '';
  }

  isValue(value) {
    return value !== null && value !== void 0;
  }

  get siblings() {
    return (this.parent && this.parent.nodes) || [];
  }

  set depth(n) {
    this[kDepth] = n;
  }
  get depth() {
    return this.parent ? this.parent.depth + 1 : this[kDepth];
  }

  get index() {
    return this.siblings.indexOf(this);
  }
}

module.exports = Node;
