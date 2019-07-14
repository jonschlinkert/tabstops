'use strict';

const formatters = require('../formatters');
const Node = require('./Node');

class Choices extends Node {
  constructor(node) {
    super(node);
    this.type = 'choices';
    this.tabstop = Number(this.value);
    this.choices = this.parse(this.match[2]);
  }

  inner() {
    return `${this.tabstop}|${this.choices.join(',')}|`;
  }

  stringify() {
    return this.match[0];
  }

  toSnippet() {
    return `\${${this.tabstop}|${this.choices.join(',')}|}`;
  }

  parse(input) {
    let choices = [];
    let choice = '';

    for (let i = 0; i < input.length; i++) {
      let value = input[i];

      if (value === '\\') {
        choice += value + (input[++i] || '');
        continue;
      }

      if (value === '"' || value === '\'') {
        let quote = value;

        while (i < input.length) {
          let ch = input[++i];
          value += ch;

          if (ch === quote) {
            break;
          }
        }
      }

      if (value === ',') {
        choices.push(choice);
        choice = '';
        continue;
      }

      choice += value;
    }

    choices.push(choice);
    return choices;
  }

  compile(options = {}) {
    return (locals = {}) => {
      let state = { node: this, resolved: 'tabstop', value: this.tabstops.get(this.tabstop) };

      if (!this.isValue(state.value)) {
        state.resolved = 'choices';
        state.value = this.choices;
      }

      return formatters[this.type](state);
    };
  }
}

module.exports = Choices;
