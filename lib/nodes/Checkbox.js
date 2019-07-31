'use strict';

const { green, dim, red, symbols } = require('ansi-colors');
const Node = require('./Node');
const init = { '-': 'disabled', 'x': 'on', ' ': 'off', '': 'off' };

const { cross, check, minus } = symbols;
const styles = { error: red, pending: dim.gray, enabled: green, disabled: dim };
const icons = { error: cross, pending: check, enabled: check, disabled: '-' };

class Checkbox extends Node {
  constructor(node) {
    super(node);
    this.type = 'checkbox';
    this.initial = init[this.match[1]];
    this.disabled = this.initial === 'disabled';
    this.enabled = this.initial === 'on';
    this.message = this.match[2];
    this.name = this.message.toLowerCase();
    this.hint = this.match[3] || '';
  }

  get indicator() {
    return styles[this.status](icons[this.status]);
  }

  toggle() {
    if (!this.disabled) {
      this.enabled = !this.enabled;
    }
  }

  compile(options) {
    return data => {
      let { indicator, message } = this;
      return this.format({ resolved: 'checkbox', indicator, message }, options);
    }
  }

  get status() {
    return this.disabled ? 'disabled' : (this.enabled ? 'enabled' : 'pending');
  }
}

module.exports = Checkbox;
