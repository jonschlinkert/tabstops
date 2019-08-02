'use strict';

const kInput = Symbol('input');
const Input = require('./Input');

class Password extends Input {
  constructor(node) {
    super(node);
    this.type = 'password';
    this.mask = '*';
  }

  // TODO: change to something more secure
  // and interesting before publishing. this
  // is temporary
  set input(value) {
    this[kInput] = this.mask.repeat(value.length);
  }

  get input() {
    return this[kInput];
  }
}

module.exports = Password;
