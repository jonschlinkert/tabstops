'use strict';

const Node = require('./Node');
const statuses = { '-': 'disabled', 'x': 'on', '': 'off' };

class Radio extends Node {
  constructor(node) {
    super(node);
    this.type = 'radio';
    let [m, status = '', groupKey = 0, message, hint] = this.match;
    this.group = groupKey;
    this.initial = statuses[status.trim()];
    this.disabled = this.initial === 'disabled';
    this.enabled = !this.disabled && this.initial === 'on';
    this.name = message.toLowerCase();
    this.message = message;
    this.hint = hint ? this.styles.muted(hint) : '';
  }

  enable() {
    this.only();
  }

  toggle() {
    !this.disabled && this.only();
  }

  space() {
    this.toggle();
  }

  // only() {
  //   this.each(ele => (ele.enabled = false));
  //   this.enabled = true;
  // }

  only() {
    this.each(ele => (ele.enabled = ele === this));
  }

  // each(fn) {
  //   for (let ele of this.items) {
  //     if ((!this.group || !ele.group) && this.group !== ele.group) {
  //       continue;
  //     }
  //     if (ele.type === this.type) {
  //       fn(ele);
  //     }
  //   }
  // }

  each(fn) {
    for (let ele of this.items) {
      if (ele.type === this.type && this.group === ele.group) {
        fn(ele);
      }
    }
  }

  every(fn) {
    for (let ele of this.items) {
      if (ele.type === this.type && this.group === ele.group) {
        if (fn(ele) === false) {
          return false;
        }
      }
    }
    return true;
  }

  // print(focused = false) {
  //   let message = focused ? this.styles.heading(this.message) : this.message;

  //   if (this.checkbox) {
  //     return `${this.indicator} ${message}`;
  //   }

  //   let output = (focused ? this.symbols.pointer : ' ') + ' ' + message;
  //   return focused ? this.styles.cyan(output) : output;
  // }

  compile(options) {
    return data => {
      let { prefix = '', msg, hint } = this;
      let value = [prefix, msg, hint].filter(Boolean).join(' ');
      let state = { from: this.type, msg, value };
      this.snapshot(state);
      return this.format(state, options);
    }
  }

  get prefix() {
    return this.pointer;
  }

  get indicator() {
    return this.styles[this.status](this.icons[this.status]);
  }

  get pointer() {
    if (this.session.focused === this) {
      return this.elements.pointer.enabled;
    }
    return this.elements.pointer.pending;
  }

  get msg() {
    if (this.session && this.session.focused === this) {
      return this.styles.underline(this.message);
    }
    return this.message;
  }

  get status() {
    return this.disabled ? 'disabled' : (this.enabled ? 'enabled' : 'pending');
  }

  get size() {
    return this.items.length;
  }
}

module.exports = Radio;
