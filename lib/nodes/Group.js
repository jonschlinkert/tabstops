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
    return this.group.items[this.index - 1];
  }
  get next() {
    return this.group.items[this.index + 1];
  }
}

class Group extends Block {
  constructor(node) {
    this.items = [];
  }

  swap(a, b) {
    let indexA = this.items.indexOf(a);
    let indexB = this.items.indexOf(b);
    if (indexA > -1 && indexB > -1) {
      this.items[indexA] = b;
      this.items[indexB] = a;
    }
  }

  get prevItem() {
    if (this.cursor > 0) {
      return this.items[this.cursor - 1];
    }
    return this.lastItem;
  }

  get nextItem() {
    if (this.cursor < this.items.length) {
      return this.items[this.cursor + 1];
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
    this.index = 0;
  }
  prev() {
    this.index--;
  }
  next() {
    this.index++;
  }
  get focused() {
    return this.items[this.index];
  }
}

class Session {
  get item() {
    return this.items[this.index];
  }
  get focused() {
    return this.item.focused;
  }
}
