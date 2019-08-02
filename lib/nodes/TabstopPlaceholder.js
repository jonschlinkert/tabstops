'use strict';

const Block = require('./Block');
const Text = require('./Text');

class TabstopPlaceholder extends Block {
  constructor(node) {
    super(node);
    this.type = 'tabstop_placeholder';
    this.number = Number(this.match[2]);
  }

  onClose(options) {
    super.onClose(options);
    if (this.nodes.length === 2 && this.openNode && this.closeNode) {
      this.nodes.splice(1, 0, new Text({ match: [''] }));
      this.emptyPlaceholder = true;
    }
  }

  hasTextPlaceholder() {
    return this.nodes.length === 3 && this.nodes[1].type === 'text';
  }

  compile(options = {}) {
    return (data = {}) => {
      let value = this.tabstops.get(this.number);
      let state = { from: 'tabstop', value };
      this.snapshot(state);

      if (!this.isValue(state.value)) {
        state.from = 'placeholder';
        state.value = this.placeholder(data, options);
        this.snapshot(state);

        if (this.hasTextPlaceholder()) {
          this.tabstops.set(this.number, this.styles.unstyle(state.value));
        }

      } else {
        this.tabstops.set(this.number, this.styles.unstyle(state.value));
      }

      return this.format(state, options);
    };
  }
}

module.exports = TabstopPlaceholder;
