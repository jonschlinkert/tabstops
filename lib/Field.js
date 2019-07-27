'use strict';

class Field {
  constructor(node, field) {
    this.type = 'field';


    this.initial = null;
    this.position = 0;
    this.index = 0;
    this.line = 0;
    this.cursor = 0;

    Reflect.defineProperty(this, 'node', {
      value: ndoe
    });

    // if (node.nodes) {
    //   this.initial = this.node.placholder();
    // }
  }

  isTabstop() {
    return typeof this.node.number === 'number';
  }

  isVariable() {
    return typeof this.node.name === 'string' && this.node.name !== '';
  }
}

// class Stop extends Field {
//   constructor(node) {
//     this.type = 'stop';
//     this.number = node.number;
//   }
// }

// class Value extends Field {
//   constructor(node) {
//     this.type = 'value';
//     this.name = node.name;
//   }
// }

module.exports = Field;
