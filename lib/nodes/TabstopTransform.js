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
    return () => {
      let saved = this.tabstops.get(this.tabstop);
      let value = this.transform(saved);
      let state = { node: this, resolved: 'tabstop', value };

      if (state.value !== void 0 && saved === void 0) {
        this.tabstops.set(this.tabstop, state.value);
      }

      return this.format(state, options);
    };
  }

  get tabstop() {
    return Number(this.nodes[0].match[1]);
  }
}

module.exports = TabstopTransform;
