'use strict';

const Parser = require('./Parser');

class Snippet extends Parser {
  constructor(input, options) {
    super(input, options);

    this.tabstops = this.options.tabstops || new Map();
    this.variables = this.options.variables || new Map();
    this.fields = this.options.fields || new Map();

    const addFields = node => {
      node.tabstops = this.tabstops;
      node.fields = this.fields;
    };

    this.on('push', addFields);
    this.on('open', addFields);
    this.on('close', addFields);
  }

  field(block) {
    this.fields[block.type] = this.fields[block.type] || [];
    this.fields[block.type].push(block);
  }

  static get parse() {
    return (input, options) => {
      let snippet = new this(input, options);
      return snippet.parse();
    };
  }

  static get compile() {
    return (input, options) => {
      let snippet = new this(input, options);
      let ast = snippet.parse();
      return ast.compile(options);
    };
  }

  static get render() {
    return (input, data, options) => {
      let snippet = new this(input, options);
      let ast = snippet.parse();
      let fn = ast.compile(options);
      return fn(data);
    };
  }

  static get Snippet() {
    return Snippet;
  }
}

module.exports = Snippet;
