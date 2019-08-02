'use strict';

const Radio = require('./Radio');

class Checkbox extends Radio {
  constructor(node) {
    super(node);
    this.type = 'checkbox';
  }

  a() {
    const enabled = this.enabled;
    this.each(ele => (ele.enabled = !enabled));
  }

  i() {
    this.each(ele => (ele.enabled = !ele.enabled));
  }

  toggle() {
    this.enabled = !this.disabled && !this.enabled;
  }
}

module.exports = Checkbox;
