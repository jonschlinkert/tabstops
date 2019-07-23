'use strict';

const Block = require('./Block');

class TabstopPlaceholder extends Block {
  constructor(node) {
    super(node);
    this.type = 'tabstop_placeholder';
  }

  placeholder(options) {
    let fns = this.innerNodes.map(node => node.compile(options));
    return (data, tabstops) => {
      let value = fns.map(fn => fn(data, tabstops)).join('');
      let saved = tabstops.get(this.tabstop);
      if (value !== void 0 && saved === void 0) {
        tabstops.set(this.tabstop, value);
      }
      return value;
    };
  }

  compile(options) {
    let placeholder = this.placeholder(options);

    return (data = {}, tabstops) => {
      let value = tabstops.get(this.tabstop) || placeholder(data, tabstops);
      tabstops.set(this.tabstop, value);
      return value;
    };
  }

  get tabstop() {
    return Number(this.nodes[0].match[1]);
  }
}

module.exports = TabstopPlaceholder;
