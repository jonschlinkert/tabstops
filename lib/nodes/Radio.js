'use strict';

const Node = require('./Node');
const init = { '-': 'disabled', 'x': 'on', ' ': 'off', '': 'off' };

class Radio extends Node {
  constructor(node) {
    super(node);
    this.type = 'radio';
    let [m, status, message, hint] = this.match;
    this.initial = init[status];
    this.disabled = this.initial === 'disabled';
    this.enabled = !this.disabled && this.initial === 'on';
    this.name = message.toLowerCase();
    this.message = message;
    this.hint = hint || '';
  }

  get indicator() {
    return this.styles[this.status](this.icons[this.status]);
  }

  toggle() {
    !this.disabled && this.only();
  }

  space() {
    this.toggle();
  }

  only() {
    this.each(ele => (ele.enabled = false));
    this.enabled = true;
  }

  each(fn) {
    for (let ele of this.items) {
      if (ele.type === this.type && (!ele.group || this.group === ele.group)) {
        fn(ele);
      }
    }
  }

  print(focused = false) {
    let message = focused ? this.styles.heading(this.message) : this.message;

    if (this.checkbox) {
      return `${this.indicator} ${message}`;
    }

    let output = (focused ? this.symbols.pointer : ' ') + ' ' + message;
    return focused ? this.styles.cyan(output) : output;
  }

  compile(options) {
    return data => {
      let { indicator, message } = this;
      let value = `${this.indicator} ${this.message}`;
      let state = { from: this.type, indicator, message, value };
      this.snapshot(state);
      return this.format(state, options);
    }
  }

  get status() {
    return this.disabled ? 'disabled' : (this.enabled ? 'enabled' : 'pending');
  }
}

module.exports = Radio;
