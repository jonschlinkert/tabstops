'use strict';

const Node = require('./Node');

class Tabstop extends Node {
  constructor(node) {
    super(node);
    this.type = 'tabstop';
    this.tabstop = Number(this.match[2] || this.match[1]);
  }

  placeholder(options) {
    let fields = this.fields.get(this.tabstop);
    let fns = [];

    for (let field of fields) {
      if (field !== this && !field.compiled) {
        field.compiled = true;
        fns.push(field.compile(options));
      }
    }

    return (data, tabstops) => {
      for (let fn of fns) {
        let output = fn(data, tabstops);
        if (output) {
          return output;
        }
      }
    };
  }

  compile(options) {
    let placeholder = this.placeholder(options);

    return (data, tabstops) => {
      let value = tabstops.get(this.tabstop) || placeholder(data, tabstops);
      tabstops.set(this.tabstop, value);
      return value;
    };
  }
}

module.exports = Tabstop;
