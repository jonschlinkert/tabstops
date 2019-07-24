'use strict';

const Parser = require('./Parser');

class Snippet extends Parser {
  constructor(input, options) {
    super(input, options);
    this.tabstops = new Map();
    this.fields = new Map();

    const addFields = node => {
      let tabstops = node.tabstops = this.tabstops;
      let fields = node.fields = this.fields;
      let compile = node.compile;
      node.compile = options => {
        return compile.call(node, { fields, tabstops, ...options });
      };
    }

    this.on('push', addFields);
    this.on('open', addFields);
    this.on('close', addFields);
  }

  field(block) {
    this.fields[block.type] = this.fields[block.type] || [];
    this.fields[block.type].push(block);
  }

  static parse(input, options) {
    let snippet = new Snippet(input, options);
    return snippet.parse();
  }

  static compile(input, options) {
    let snippet = new Snippet(input, options);
    let ast = snippet.parse();
    return ast.compile(options);
  }

  static render(input, data, options) {
    let snippet = new Snippet(input, options);
    let ast = snippet.parse();
    let fn = ast.compile(options);
    return fn(data);
  }

  static get Snippet() {
    return Snippet;
  }
}

module.exports = Snippet;
