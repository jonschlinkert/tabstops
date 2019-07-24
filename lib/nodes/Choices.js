'use strict';

const Node = require('./Node');

class Choices extends Node {
  constructor(node) {
    super(node);
    this.type = 'choices';
    this.tabstop = Number(this.match[1]);
    this.choices = this.parse(this.match[2]);
    this.chosen = this.choices[0];
  }

  choose(n) {
    this.chosen = this.choices[n] || '';
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
    return () => {
      let value = this.chosen.replace(/\\(?=[,|])/g, '');
      let state = { node: 'this', resolved: 'choice', value };

      if (this.isValue(state.value) && this.tabstops) {
        this.tabstops.set(this.tabstop, state.value);
      }

      return this.format(state, options);
    };
  }
}

module.exports = Choices;
