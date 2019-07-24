'use strict';

const Transform = require('./Transform');

class TabstopTransform extends Transform {
  constructor(node) {
    super(node);
    this.type = 'tabstop_transform';
  }

  onClose(options) {
    super.onClose(options);

    if (this.fields) {
      let field = this.fields.get(this.tabstop) || [];
      this.fields.set(this.tabstop, field.concat(this));
    }
  }

  compile(options = {}) {
    let tabstops = options.tabstops || new Map();

    return () => {
      let value = tabstops.get(this.tabstop) || '';
      let output = this.transform(value);
      let state = { node: this, resolved: 'tabstop', value: output };

      tabstops.set(this.tabstop, state.value);
      return this.format(state, options);
    };
  }

  get tabstop() {
    return Number(this.nodes[0].match[1]);
  }
}

module.exports = TabstopTransform;
