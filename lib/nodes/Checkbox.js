'use strict';

const Radio = require('./Radio');

class Checkbox extends Radio {
  constructor(node) {
    super(node);
    this.type = 'checkbox';
    this.checkbox = true;
  }

  enable() {}

  a() {
    const enabled = this.every(item => item.enabled === true);
    this.each(ele => (ele.enabled = !enabled));
  }

  i() {
    this.each(ele => (ele.enabled = !ele.enabled));
  }

  space() {
    this.enabled = !this.disabled && !this.enabled;
  }

  get prefix() {
    return this.indicator;
  }
}

module.exports = Checkbox;
