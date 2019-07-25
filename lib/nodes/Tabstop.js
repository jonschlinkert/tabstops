'use strict';

const Node = require('./Node');

class Tabstop extends Node {
  constructor(node) {
    super(node);
    this.type = 'tabstop';
    this.number = Number(this.match[2] || this.match[1]);
  }

  placeholder(options = {}) {
    let { fields = new Map() } = options;
    let nodes = fields.get(this.number) || [];
    let fns = [];

    for (let node of nodes) {
      if (node !== this && !node.compiled) {
        node.compiled = true;
        fns.push(node.compile(options));
      }
    }

    return data => {
      for (let fn of fns) {
        let output = fn(data);
        if (output) {
          return output;
        }
      }
    };
  }

  inner() {
    return `${this.number}`;
  }

  compile(options = {}) {
    let placeholder = this.placeholder(options);

    return data => {
      let value = this.tabstops.get(this.number);
      let state = { resolved: 'tabstop', value };

      if (!this.isValue(value)) {
        state.resolved = 'placeholder';
        state.value = placeholder(data) || '';
      }

      // this.tabstops.set(this.tabstop, state.value);
      return this.format(state, options);
    };
  }
}

module.exports = Tabstop;
