'use strict';

class State {
  constructor(input) {
    this.stack = [];
    this.tokens = [];
    this.input = input; // unmodified user-defined input string
    this.string = input; // input string, minus consumed
    this.consumed = ''; // consumed part of the input string

    this.loc = {
      index: 0,
      column: 0,
      line: 1
    };
  }
};

console.log();
process.cwd()
module.exports = State;
