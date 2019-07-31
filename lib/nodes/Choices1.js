'use strict';

const kChoices = Symbol('choices');
const colors = require('ansi-colors');
const Node = require('./Node');

class Choices extends Node {
  constructor(node) {
    super(node);
    this.type = 'choices';
    this.number = Number(this.match[2]);
    this.cursor = 0;
    this.choices = this.parse(this.match[3]);
  }

  choose(n) {
    this.cursor = n;
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

  compile(options) {
    return data => {
      let value = this.chosen.replace(/\\(?=[,|])/g, '');
      let state = { resolved: 'choice', value };

      this.tabstops.set(this.number, colors.unstyle(value));
      return this.format(state, options);
    };
  }

  get chosen() {
    return this.choices[this.cursor] || '';
  }
}

module.exports = Choices;
