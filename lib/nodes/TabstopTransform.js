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
      let field = this.fields.get(this.number) || [];
      this.fields.set(this.number, field.concat(this));
    }
  }

  compile(options = {}) {
    return () => {
      let saved = this.tabstops.get(this.number);
      let value = this.transform(saved);
      let state = { resolved: 'tabstop', value };

      // this.tabstops.set(this.number, state.value);
      return this.format(state, options);
    };
  }

  get number() {
    return Number(this.nodes[0].match[1]);
  }
}

module.exports = TabstopTransform;
