'use strict';

const Node = require('./Node');
const init = { '-': 'disabled', 'x': 'on', ' ': 'off', '': 'off' };
const { styles, icons } = require('../styles');

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
    return styles[this.status](icons[this.status]);
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
    let message = focused ? styles.heading(this.message) : this.message;
    return `${this.indicator} ${message}`;
  }

  compile(options) {
    return data => {
      let { indicator, message } = this;
      let value = `${this.indicator} ${this.message}`;
      return this.format({ resolved: this.type, indicator, message, value }, options);
    }
  }

  get status() {
    return this.disabled ? 'disabled' : (this.enabled ? 'enabled' : 'pending');
  }
}

module.exports = Radio;
