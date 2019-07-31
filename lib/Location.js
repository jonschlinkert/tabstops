'use strict';

const util = require('util');

class Position {
  constructor(loc) {
    this.index = loc.index;
    this.column = loc.column;
    this.line = loc.line;
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
  get lines() {
    return [this.start.line, this.end.line];
  }
  static get Location() {
    return Location;
  }
  static get Position() {
    return Position;
  }
}

module.exports = Location;
