'use strict';

const kDepth = Symbol('depth');
const Data = require('../Data');
const { define } = require('../utils');

/**
 * Base `Node` class, used by all other classes in the parse tree.
 */

class Node {
  constructor(node) {
    this.type = node.type;

    if (node.value === void 0 && node.match) {
      this.value = node.match[0];
    }

    for (let key of Object.keys(node)) {
      if (!(key in this)) {
        this[key] = node[key];
      }
    }

    define(this, 'history', []);
    define(this, 'match', this.match || [this.value]);
  }

  snapshot(state) {
    let saved = { ...state };
    this.history.push(saved);
    return saved;
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
          return false;
        }
      }
    }
  }

  isInside(type) {
    return this.parent && (this.parent.type === type || this.parent.isInside(type));
  }

  ancestor(type) {
    if (this.parent) {
      return this.parent.type === type ? this.parent : this.parent.ancestor(type);
    }
    return null;
  }

  find(type) {
    if (this.type === type) {
      return this;
    }
    if (this.nodes) {
      for (let node of this.nodes) {
        let found = node.find(type);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  inner() {
    return this.value;
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

  toString() {
    return this.stringify();
  }

  style(value, state) {
    return value;
  }

  /**
   * The format method allows implementors to modify values before
   * injecting them into the snippet string, for both tabstops and
   * variables. To use this method, pass an object of functions
   * on the `format` option, where each property is named for the
   * node type to format. Alternatively, pass a single function
   * on `options.format` to format all node types. Format functions
   * receive a `state` object as the first argument, and a `history`
   * array with previous states as the second argument.
   *
   * @param {Object} `state`
   * @param {Object} `options`
   * @return {String}
   * @api public
   */

  format(state, options = {}) {
    let type = this.type;
    if (type === 'root' || type === 'open' || type === 'close') {
      type = 'text';
    }

    let fn = options.format && (options.format[type] || options.format);
    if (typeof fn !== 'function') {
      return this.style(state.value, state);
    }

    return this.style(fn.call(this, state), state);
  }

  /**
   * Resolve the value to return for the given `key`.
   *
   * @param {Data} `data` Instance of Data or `Map`.
   * @param {String} `key` property name to resolve. Dot-notation is supported.
   * @return {String|undefined}
   * @api public
   */

  resolve(data, key) {
    let from;
    for (let obj of [].concat(data)) {
      if (!obj) continue;
      let values = Data.isData(obj) ? obj : new Data(obj);
      let value = values.get(key);
      if (this.isValue(value)) {
        from = value;
        break;
      }
    }

    if (!this.isValue(from)) {
      from = this.variables.get(key);
    }

    if (typeof from === 'function') {
      from = from.call(this);
    }

    return from;
  }

  compile(options) {
    return () => {
      let state = { from: 'value', value: this.value };
      this.snapshot(state);
      return this.format(state, options);
    }
  }

  render(data, options) {
    return this.compile(options)(data);
  }

  isValue(value) {
    return value !== '' && value !== void 0 && value !== null;
  }

  get key() {
    return this.name || this.number;
  }

  get kind() {
    if (typeof this.number === 'number') {
      return 'tabstop';
    }
    if (typeof this.name === 'string') {
      return 'variable';
    }
    return 'text';
  }

  get siblings() {
    return (this.parent && this.parent.nodes) || [];
  }

  get index() {
    return this.siblings.indexOf(this);
  }

  get prev() {
    return this.siblings[this.index - 1];
  }

  get next() {
    return this.siblings[this.index + 1];
  }

  set depth(n) {
    this[kDepth] = n;
  }
  get depth() {
    return this.parent ? this.parent.depth + 1 : this[kDepth];
  }
}

module.exports = Node;
