'use strict';

const util = require('util');

class Position {
  constructor(loc) {
    this.index = loc.index;
    this.column = loc.column;
    this.line = loc.line;
  }

  [util.inspect.custom]() {
    return `<Position ${this.line}:${this.column}>`;
  }
}

class Location {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
  get range() {
    return [this.start.index, this.end.index];
  }
  static get Position() {
    return Position;
  }
}

module.exports = Location;
