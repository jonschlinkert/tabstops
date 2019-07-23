'ue strict';

class Node {
  constructor(node) {
    this.type = node.type;

    for (let key of Object.keys(node)) {
      if (!(key in this)) {
        this[key] = node[key];
      }
    }

    if (this.match && !this.value) {
      this.value = this.match[0];
    }

    if (this.value && !this.match) {
      this.match = [this.value];
    }
  }

  clone() {
    let node = new this.constructor(this);
    if (node.nodes) {
      node.nodes = node.nodes.map(n => n.clone());
    }
    return node;
  }

  append(node) {
    if (this.value) {
      this.match[0] += node.value;
      this.value += node.value;
    }
  }

  replace(node) {
    this.siblings[this.index] = node;
    node.parent = this.parent;
  }

  remove() {
    this.siblings.splice(this.index, 1);
  }

  compile(options) {
    return () => this.value;
  }

  render(data, options, tabstops) {
    return this.compile(options)(data, tabstops);
  }

  stringify() {
    if (this.match && !this.nodes) {
      return this.match[0];
    }
    if (this.nodes) {
      return this.nodes.map(node => node.stringify()).join('');
    }
    return '';
  }

  isValue(value) {
    return value !== '' && value !== null && value !== void 0;
  }

  get siblings() {
    return (this.parent && this.parent.nodes) || [];
  }

  get index() {
    return this.siblings.indexOf(this);
  }
}

module.exports = Node;
