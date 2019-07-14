'use strict';

const Events = require('events');
const errors = require('./errors');
const Location = require('./location');
const { Position } = Location;

const assert = (value, message, Ctor = Error) => {
  if (!value) {
    throw new Ctor(message);
  }
};

class Token {
  constructor(token) {
    this.type = token.type;
    this.value = token.value || token.match[1] || token.match[0];
    this.match = token.match;
  }
}

class Lexer extends Events {
  constructor(input) {
    super();
    this.rest = input;
    this.source = input;
    this.input = input;
    this.consumed = '';
    this.tokens = [];
    this.queue = [];
    this.loc = new Position({ index: 0, column: 0, line: 1 });
    this.handlers = new Map();
    this.types = new Set();
  }

  set(type, handler = val => val) {
    this.handlers.set(type, handler);
    if (!this.types.has(type)) this.types.add(type);
    return this;
  }

  tokenize() {
    while (this.push(this.next()));
    return this.tokens;
  }

  match(regex) {
    assert(regex instanceof RegExp, 'Expected a regular expression');
    assert(regex.source[0] === '^', 'Expected regex to start with "^"');

    let match = regex.exec(this.rest);
    if (!match) return null;

    assert(match[0] !== '', 'Regex should not match an empty string', SyntaxError);
    this.consume(match[0].length, match[0]);
    return match;
  }

  location() {
    const start = new Position(this.loc);

    return token => {
      token.loc = new Location(start, new Position(this.loc));
      return token;
    };
  }

  updateLocation(value, len = value.length) {
    let i = value.lastIndexOf('\n');
    this.loc.column = ~i ? len - i : this.loc.column + len;
    this.loc.line += Math.max(0, value.split('\n').length - 1);
    this.loc.index += len;
  }

  consume(len, value = this.rest.slice(0, len)) {
    this.consumed += value;
    this.rest = this.rest.slice(len);
    this.updateLocation(value, len);
    return value;
  }

  enqueue(value) {
    value && this.queue.push(value);
    return value;
  }

  dequeue() {
    return this.queue.shift();
  }

  lookahead(n) {
    assert(Number.isInteger(n), 'Expected a positive integer');
    let fetch = n - this.queue.length;
    while (fetch-- > 0 && this.enqueue(this.advance()));
    return this.queue[--n];
  }

  lookbehind(n) {
    assert(Number.isInteger(n), 'Expected a positive integer');
    return this.tokens[this.tokens.length - n];
  }

  peek() {
    return this.lookahead(1);
  }

  prev() {
    return this.lookbehind(1);
  }

  skip(n = 1) {
    assert.equal(typeof n, 'number', 'Expected a number');
    return this.skipWhile(() => n-- > 0);
  }

  skipWhile(fn = () => !this.eos()) {
    const skipped = [];
    while (fn.call(this, this.peek())) skipped.push(this.next());
    return skipped;
  }

  handle(type) {
    let location = this.location();
    let handler = this.handlers.get(type);
    let token = handler.call(this, this.current);
    if (token) {
      return (this.current = location(new Token(token)));
    }
  }

  scan(regex, type = 'text') {
    try {
      let match = this.match(regex);
      if (match) {
        match.regex = regex;
        match.type = type;
        return new Token({ type, value: match[1] || match[0], match });
      }
    } catch (err) {
      err.regex = regex;
      err.type = type;
      throw err;
    }
  }

  capture(type, regex, fn) {
    let handler = prev => {
      let token = this.scan(regex, type);
      if (token) {
        let value = fn ? fn(token, prev) : token;
        this.emit('capture', { type, value, regex, consumed: this.consumed });
        return value;
      }
    };
    this.set(type, handler);
    return this;
  }

  advance() {
    if (this.eos()) return null;
    for (let type of this.types) {
      if (this.handle(type)) {
        return this.current;
      }
    }
    this.fail();
  }

  next() {
    return this.dequeue() || this.advance();
  }

  push(token) {
    if (token) this.tokens.push(token);
    return token;
  }

  fail() {
    let input = utils.format(this.rest.slice(0, 10));
    let error = errors.UNMATCHED_INPUT;
    throw new Error(error(input));
  }

  bos() {
    return this.loc.index === 0;
  }

  eos() {
    return this.loc.index >= this.input.length && this.queue.length === 0;
  }
}

module.exports = Lexer;
