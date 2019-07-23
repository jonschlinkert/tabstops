'use strict';

const Node = require('./Node');

class Choices extends Node {
  constructor(node) {
    super(node);
    this.type = 'choices';
    this.tabstop = Number(this.match[1]);
    this.choices = this.parse(this.match[2]);
    this.focused = this.choices[0];
  }

  focus(n) {
    this.choice = this.choices[n] || '';
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

  compile(options, tabstops) {
    // let opts = { formatters, tabstops: this.tabstops, ...options };
    // let format = opts.formatter[this.type] || opts.default;

    return (context = {}) => {
      let state = { node: this, resolved: 'choice', value: this.focused };

      // if (!this.isValue(state.value)) {
      //   state.resolved = 'choices';
      //   state.value = this.choices;
      // }

      return state.value.replace(/\\(?=[,|])/g, '');
      // return format(state);
    };
  }
}

module.exports = Choices;
