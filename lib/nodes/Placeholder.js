'use strict';

const Block = require('./Block');
const Text = require('./Text');

class Placeholder extends Block {
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

  textPlaceholder() {
    if (this.hasTextPlaceholder()) {
      return this.nodes[1].value;
    }
  }
}

module.exports = Placeholder;
