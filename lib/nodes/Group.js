'use strict';

const Block = require('./Block');

class Item {
  constructor(item) {
    this.name = item.name;
    this.value = item.value;
    this.node = item;
  }
  swap(item) {
    this.group.swap(this, item);
  }
  get prev() {
    return this.group.items[this.idx - 1];
  }
  get next() {
    return this.group.items[this.idx + 1];
  }
}

class Group extends Block {
  constructor(node) {
    this.items = [];
    this.idx = 0;
  }

  push(item) {
    item.group = this;
    this.items.push(item);
  }

  swap(a, b) {
    let indexA = this.items.indexOf(a);
    let indexB = this.items.indexOf(b);
    if (indexA > -1 && indexB > -1) {
      this.items[indexA] = b;
      this.items[indexB] = a;
    }
  }

  focus(value) {
    this.idx = this.items.findIndex(n => n === value || n.key === value);
    this.focused.enable && this.focused.enable();
  }

  get length() {
    return this.items.length;
  }

  get focused() {
    return this.items[this.idx];
  }

  get prevItem() {
    if (this.idx > 0) {
      return this.items[this.idx - 1];
    }
    return this.lastItem;
  }

  get nextItem() {
    if (this.idx < this.items.length) {
      return this.items[this.idx + 1];
    }
    return this.firstItem;
  }

  get lastItem() {
    return this.items[this.items.length - 1];
  }

  get firstItem() {
    return this.items[0];
  }
}

class Node {
  get focused() {
    return this;
  }
}

class Choices extends Node {
  constructor() {
    this.items = [];
    this.idx = 0;
  }
  prev() {
    this.idx--;
  }
  next() {
    this.idx++;
  }
  get focused() {
    return this.items[this.idx];
  }
}

class Session {
  get item() {
    return this.items[this.idx];
  }
  get focused() {
    return this.item.focused;
  }
}
