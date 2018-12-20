'use strict';

class Position {
  constructor(state) {
    this.index = state.loc.index;
    this.column = state.loc.column;
    this.line = state.loc.line;
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
}

module.exports = state => {
  let start = new Position(state);

  return tok => {
    let end = new Position(state);
    tok.loc = new Location(start, end);
    return tok;
  };
};
