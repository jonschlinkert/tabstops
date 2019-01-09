'use strict';

// require('time-require');
const parse = require('./lib/parse');
const compile = require('./lib/compile');
const TabState = require('./lib/tabstate');

class Tabstops {
  constructor(input, state, options) {
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
   * Render the snippet.
   */

  render(context) {
    return this.fn(context);
  }
}

module.exports = Tabstops;
