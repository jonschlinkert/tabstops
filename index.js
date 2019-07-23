'use strict';

const parse = require('./lib/parse');
const compile = require('./lib/compile');
const TabState = require('./lib/TabState');
const helpers = require('./lib/helpers');

class Snippet {
  constructor(input, options, state) {
    this.options = { ...options };
    this.parser = new Parser(input, this.options);
    this.ast = parse();
    this.reset(state);
  }

  reset(state) {
    this.state = new TabState(state);
  }

  /**
   * Move the cursor left or right in the input string
   */

  left() {
    this.state.cursor--;
  }
  right() {
    this.state.cursor++;
  }

  /**
   * Jump to the next or previous tabstop
   */

  prev() {
    this.state.tabstop--;
  }
  next() {
    this.state.tabstop++;
  }

  /**
   * Scroll content up or down
   */

  up() {
    this.state.index--;
  }
  down() {
    this.state.index++;
  }

  /**
   * Increase or decrease the number of visible lines rendered.
   */

  pageUp() {
    this.state.limit--;
  }
  pageDown() {
    this.state.limit++;
  }

  /**
   * Render the snippet that was passed to the Snippet contstructor.
   *
   * @param {Object} `context` The data object to use for rendering the string.
   * @return {String} Returns the rendered string.
   * @api public
   */

  context(data = {}) {
    return { ...data, helpers: { ...this.helpers, ...data.helpers } };
  }

  /**
   * Resolve a value.
   *
   * @param {any} `value`
   * @param {String} `key`
   * @param {Object} `node`
   * @return {String} Returns the rendered string.
   * @api public
   */

  resolve(value, key, node) {
    if (typeof this.options.resolve === 'function') {
      return this.options.resolve(value, key, node);
    }
    return value;
  }

  /**
   * Compile the snippet that was passed to the Snippet contstructor.
   *
   * @param {Object} `options`
   * @return {Function} Returns the compiled function.
   * @api public
   */

  async compile(options) {
    let opts = { ...this.options, ...options };
    let resolve = this.resolve.bind(this);
    this.fn = this.ast.compile(opts, resolve);
    return this.fn;
  }

  /**
   * Render the string that was passed to the Snippet contstructor.
   *
   * @param {Object} `context` The data object to use for rendering the string.
   * @return {String} Returns the rendered string.
   * @api public
   */

  async render(data) {
    if (!this.fn) this.fn = this.compile(this.options);
    return this.fn(this.context(data), this.state, this.resolve);
  }

  /**
   * Parse the given input string.
   *
   * @param {String} `input`
   * @param {Object} `options`
   * @return {Object} Returns an abstract syntax tree (AST).
   * @api public
   */

  static parse(input, options) {
    return parse(input, options);
  }

  /**
   * Compile the given AST or input string.
   *
   * @param {Object|String} `ast` AST returned by the parse method, or input string.
   * @param {Object} `options`
   * @return {Function} Returns a function to be called with a context (data object).
   * @api public
   */

  static resolve(value) {
    return value;
  }

  /**
   * Render the given input string.
   *
   * @param {String} `input`
   * @param {Object} `data`
   * @param {Object} `options`
   * @return {String} Returns the rendered string.
   * @api public
   */

  static render(input, data, options) {
    return parse(input, options).compile(options)(data);
  }
}

module.exports = Snippet;
