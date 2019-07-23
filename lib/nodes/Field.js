'use strict';

class Field {
  constructor(index, placeholder, location) {
    this.placeholder = placeholder;
    this.location = location;
    this.index = index;
  }

  get length() {
    return this.placeholder.length;
  }
}

module.exports = Field;
