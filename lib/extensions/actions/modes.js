'use strict';

const colors = require('ansi-colors');

module.exports = {
  showPlaceholders(item, value) {
    let style = colors[item.kind === 'tabstop' ? 'blue' : 'green'];
    if (item.type === 'choices') {
      style = colors.yellow;
    }

    if (this.mode === 1 && item.kind === 'tabstop') {
      return style(item.stringify());
    }

    if (this.mode === 2 && item.kind === 'variable') {
      return style(item.stringify());
    }

    if (this.mode === 3) {
      return style(item.stringify());
    }

    if (this.mode === 4) {
      return item.stringify();
    }

    return value;
  }
};
