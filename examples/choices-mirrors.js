'use strict';

const prompt = require('./support/prompt');

prompt(`
  Add some numbers:
    \${1:$2}
    \${2|Foo,Bar,Baz|}

`, {

  actions: {
    // left() {
    //   if (this.focused.choices) {
    //     this.focused.prev();
    //   }
    // },
    // right() {
    //   if (this.focused.choices) {
    //     this.focused.next();
    //   }
    // },
    // prev() {
    //   console.log(this)
    //   if (this.index > 0) {
    //     this.index--;
    //   }
    // },
    // next() {
    //   if (this.index < this.length - 1) {
    //     this.index++;
    //   }
    // },
    // up() {
    //   return this.prev();
    // },
    // down() {
    //   return this.next();
    // }
  },

});
