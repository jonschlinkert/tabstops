'use strict';

const { Block, Node } = require('./Block');

class Choices extends Block {
  constructor(node) {
    super(node);
    this.type = 'choices';
    this.number = Number(this.match[2]);
    this.choices = [];
    this.choicesMap = new Map();
    this.idx = 0;
  }

  prevChoice() {
    this.idx = (this.idx - (1 % this.size) + this.size) % this.size;
  }

  nextChoice() {
    this.idx = (this.idx + 1) % this.size;
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
    this.idx = n;
  }

  placeholder() {
    return this.selected;
  }

  compile(options) {
    return data => {
      let value = this.selected;
      let state = { from: 'choice', value };
      this.snapshot(state);

      if (value instanceof Node) {
        state.from = 'node';
        let output = this.styles.unstyle(value.compile(options)(data));
        let choice = this.choicesMap.get(this.idx);
        this.choicesMap.delete(this.idx);

        if (choice) {
          if (typeof choice.value !== 'string') {
            this.choices.splice(this.idx, 1, ...[].concat(choice.value).map(String));
            state.value = this.selected;
          } else {
            state.value = choice.value;
          }
        } else {
          state.value = output;
        }

        if (state.value.includes(',')) {
          this.choices.splice(this.idx, 1, ...state.value.split(','));
          state.value = this.selected;
        }

        this.snapshot(state);
      }

      if (this.isValue(state.value)) {
        state.value = state.value.replace(/\\(?=[,|])/g, '');
        this.tabstops.set(this.key, this.styles.unstyle(state.value));
        this.snapshot(state);
      }

      return this.format(state, options, this.history);
    };
  }

  get size() {
    return this.choices.length;
  }

  get selected() {
    return this.choices[this.idx] || '';
  }
}

module.exports = Choices;
