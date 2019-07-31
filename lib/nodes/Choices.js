'use strict';

const kChoices = Symbol('choices');
const colors = require('ansi-colors');
const Block = require('./Block');
const Node = require('./Node');

class Choices extends Block {
  constructor(node) {
    super(node);
    this.type = 'choices';
    this.number = Number(this.match[2]);
    this.choices = [];
    this.choicesMap = new Map();
    this.cursor = 0;
  }

  onClose() {
    this.resetChoices();
  }

  resetChoices() {
    this.choices = this.innerNodes
      .filter(node => node.type !== 'comma')
      .map((node, i) => {
        if (node.type === 'text') {
          return node.toString();
        }
        return node;
      });
  }

  getIndex(node) {
    if (!node.isInside('choices')) return -1;
    let index = this.choices.indexOf(node);
    if (index === -1) {
      let parent = node.parent;
      while (parent.parent && parent.parent !== this) {
        parent = parent.parent;
      }
      index = this.choices.indexOf(parent);
    }
    return index;
  }

  choose(n) {
    this.cursor = n;
  }

  compile(options) {
    return data => {
      let value = this.selected;
      let state = { resolved: 'choice', value };

      // if (value instanceof Node) {
      //   state.resolved = 'node';
      //   let output = colors.unstyle(value.render(data, options));
      //   let choice = this.choicesMap.get(this.cursor);
      //   this.choicesMap.delete(this.cursor);

      //   if (choice) {
      //     if (typeof choice.value !== 'string') {
      //       this.choices.splice(this.cursor, 1, ...[].concat(choice.value).map(String));
      //       state.value = this.selected;
      //     } else {
      //       state.value = choice.value;
      //     }
      //   } else {
      //     state.value = output;
      //   }

      //   if (state.value.includes(',')) {
      //     this.choices.splice(this.cursor, 1, ...state.value.split(','));
      //     state.value = this.selected;
      //   }
      // }

      if (this.isValue(state.value)) {
        state.value = state.value.replace(/\\(?=[,|])/g, '');
        this.tabstops.set(this.key, colors.unstyle(state.value));
      }

      return this.format(state, options);
    };
  }

  get size() {
    return this.choices.length;
  }

  get selected() {
    return this.choices[this.cursor] || '';
  }
}

module.exports = Choices;
