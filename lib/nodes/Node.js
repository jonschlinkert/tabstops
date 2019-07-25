'use strict';

const Data = require('../Data');
const utils = require('../utils');
const kDepth = Symbol('depth');

/**
 * Returns true if the given `value` is an instance of the Data class,
 * or is an object with get/set methods.
 * @param {Object} `value`
 * @return {Boolean}
 */

const isData = value => {
  if (value instanceof Data) {
    return true;
  }
  if (utils.isObject(value) && typeof value.get === 'function') {
    return true;
  }
  return false;
};

/**
 * Base `Node` class, used by all other classes in the parse tree.
 */

class Node {
  constructor(node) {
    this.type = node.type;
    this.initial = null;

    for (let key of Object.keys(node)) {
      if (!(key in this)) {
        this[key] = node[key];
      }
    }

    if (this.match && this.value === void 0) {
      this.value = this.match[0];
    }

    if (this.value && this.match === void 0) {
      this.match = [this.value];
    }

    utils.define(this, 'history', []);
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

  format(currentState, options = {}) {
    if (!options.format) return currentState.value;

    let type = this.type;
    if (type === 'root' || type === 'open' || type === 'close') {
      type = 'text';
    }

    let fn = options.format[type] || options.format;
    if (typeof fn !== 'function') {
      return currentState.value;
    }

    let state = { type, ...currentState };
    let history = this.history.slice();
    this.history.push({ ...state });
    utils.define(state, 'node', this);
    return fn(state, history);
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
    let values = isData(data) ? data : new Data(data);
    let value = values.get(key);

    if (this.isValue(value)) {
      return value;
    }

    if (isData(this.data)) {
      return this.data.get(key);
    }
  }

  compile(options) {
    return () => this.format({ resolved: 'value', value: this.value });
  }

  render(data, options) {
    return this.compile(options)(data);
  }

  isValue(value) {
    return value !== null && value !== void 0;
  }

  get siblings() {
    return (this.parent && this.parent.nodes) || [];
  }

  get index() {
    return this.siblings.indexOf(this);
  }

  set depth(n) {
    this[kDepth] = n;
  }
  get depth() {
    return this.parent ? this.parent.depth + 1 : this[kDepth];
  }
}

module.exports = Node;
