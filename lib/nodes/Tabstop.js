'use strict';

const Node = require('./Node');

class Tabstop extends Node {
  constructor(node) {
    super(node);
    this.type = 'tabstop';
    this.number = Number(this.match[3] || this.match[1]);
  }

  inner() {
    return `${this.number}`;
  }

  placeholder(data, options) {
    if (this.resolving) return;
    this.resolving = true;
    let fields = this.fields.tabstop.get(this.number);
    if (fields) {
      for (let field of fields) {
        if (field !== this && field.placeholder) {
          let value = field.placeholder(data, options);
          if (this.isValue(value)) {
            this.resolving = false;
            return value;
          }
        }
      }
    }
    this.resolving = false;
  }

  compile(options = {}) {
    return data => {
      let value = this.tabstops.get(this.number);
      let state = { resolved: 'tabstop', value };

      if (!this.isValue(state.value)) {
        state.resolved = 'placeholder';
        state.value = this.placeholder(data, options);
      }

      return this.format(state, options);
    };
  }
}

module.exports = Tabstop;
