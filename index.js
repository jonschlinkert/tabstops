'use strict';

const parse = require('./lib/parse');
const compile = require('./lib/compile');
const TabState = require('./lib/tabstate');
const helpers = require('./lib/helpers');

class Snippet {
  constructor(input, options, state) {
    this.options = { ...options };
    this.state = new TabState(state);
    this.ast = parse(input, this.options);
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

  context(locals = {}) {
    return { ...locals, helpers: { ...this.helpers, ...locals.helpers } };
  }

  resolve(value, key, node, parent) {
    if (typeof this.options.resolve === 'function') {
      return this.options.resolve(value, key, node, parent);
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
    return compile(this.ast, { ...this.options, ...options }, this.resolve.bind(this));
  }

  /**
   * Render the string that was passed to the Snippet contstructor.
   *
   * @param {Object} `context` The data object to use for rendering the string.
   * @return {String} Returns the rendered string.
   * @api public
   */

  async render(locals) {
    if (!this.fn) this.fn = await this.compile(this.options);
    return this.fn(this.context(locals), this.state, this.resolve);
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

  static compile(ast, options) {
    return compile(ast, options);
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
   * @param {Object} `locals`
   * @param {Object} `options`
   * @return {String} Returns the rendered string.
   * @api public
   */

  static get render() {
    return (str, locals, options) => {
      return compile(parse(str, options), options)(locals);
    }
  }
}

module.exports = Snippet;
