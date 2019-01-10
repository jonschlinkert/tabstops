'use strict';

const parse = require('./lib/parse');
const compile = require('./lib/compile');
const TabState = require('./lib/tabstate');

class Tabstops {
  constructor(input, options, state) {
    this.options = options;
    this.state = new TabState(state);
    this.ast = parse(input, options);
    this.fn = compile(this.ast, options);
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
   * Render the snippet that was passed to the TabStops contstructor.
   *
   * @param {Object} `context` The data object to use for rendering the string.
   * @return {String} Returns the rendered string.
   * @api public
   */

  render(context) {
    return this.fn(context, this.state);
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
}

module.exports = Tabstops;
