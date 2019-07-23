'use strict';

const Scope = require('./Scope');
const nodes = require('./nodes');
const Parser = require('./Parser');
const { rules } = require('./constants');

const {
  Choices,
  Placeholder,
  PlaceholderTransform,
  Tabstop,
  Variable,
  VariableTransform
} = nodes;

class Snippet extends Parser {
  constructor(input, option) {
    super(input);
    this.tabstops = new Map();
    this.fields = new Map();
    this.state = {};

    this.values = {
      tabstops: [],
      variables: []
    };

    this.register(rules);
    this.initialize();
  }

  field(block) {
    this.fields[block.type] = this.fields[block.type] || [];
    this.fields[block.type].push(block);
  }

  register(rules = []) {
    for (let [name, rule] of rules) {
      this.capture(name, rule);
    }
  }

  initialize() {
    let location = this.lexer.location();
    let first = true;

    this.on('push', node => {
      node.tabstops = this.tabstops;

      if (first === true) {
        this.lexer.handlers.delete('bom');
        this.lexer.types.delete('bom');
        first = false;
      }
      if (!node.loc) location(node);
      location = this.lexer.location();
    });

    this.on('block_push', node => {
      // console.log(node)

    });

    this.on('block_close', block => {
      this.field(block);
      // console.log(block)

    });

    let text = node => {
      node.type = 'text';
      return node;
    };

    this.handler('bom', node => {
      node.type = 'text';
      node.value = '';
      return node;
    });

    this.handler('brackets', text);
    this.handler('escaped', text);
    this.handler('text', text);

    this.handler('variable', node => new Variable(node));
    this.handler('choices', node => new Choices(node));
    this.handler('tabstop', node => {
      if (this.isInsideScope()) {
        node.value = node.match[0];
        return text(node);
      }
      return new Tabstop(node);
    });

    this.handler('placeholder', node => {
      let [, open, stop, variable] = node.match;
      let match = node.match;
      let block;

      if (stop) {
        block = new Tabstop({ nodes: [], match });
        block.tabstop = Number(stop);
        block.value = match[0];
      }

      if (variable) {
        block = new Placeholder({ match });
        block.variable = variable;
        block.value = match[0];
      }

      node.type = 'open_brace';
      node.value = node.match[0];
      node.output = '';
      node.open = true;

      this.push(location(block));
      return node;
    });

    this.handler('placeholder_transform', node => {
      let [, open, stop, variable] = node.match;
      let match = node.match;
      let block;

      block = new PlaceholderTransform({ match });
      block.tabstop = Number(stop);
      block.value = match[0];

      this.pushScope(new Scope({ type: block.type, blocks: [block] }));

      node.type = 'open_brace';
      node.value = open;
      node.output = '';
      node.open = true;

      this.push(location(block));
      return node;
    });

    this.handler('variable_transform', node => {
      let [, open, variable] = node.match;
      let match = node.match;
      let block;

      block = new VariableTransform({ match });
      block.variable = variable;
      block.value = match[0];

      this.pushScope(new Scope({ type: block.type, blocks: [block] }));

      node.type = 'open_brace';
      node.value = open;
      node.output = '';
      node.open = true;
      // node.parts = { open, variable, match: match[0] };

      this.push(location(block));
      return node;
    });

    this.handler('close_brace', node => {
      if (this.block.type === 'root') {
        return text(node);
      }
      node.close = true;
      node.output = '';
      return node;
    });

    this.handler('colon', node => {
      if (this.block.type === 'root' || this.isInsideScope()) {
        return text(node);
      }
      if (this.block.nodes.length >= 2) {
        return text(node);
      }
      return node;
    });

    this.handler('slash', node => {
      if (this.isInsideScope()) {
        this.block.slashes = (this.block.slashes || 0) + 1;
      }
      return node;
    });

    this.handler('newline', node => {
      this.lexer.loc.line++;
      node.type = 'text';
      return node;
    });
  }

  static parse(input) {
    let snippet = new Snippet(input);
    return snippet.parse();
  }

  static compile(input, options) {
    let snippet = new Snippet(input);
    let ast = snippet.parse();
    return ast.compile(options);
  }

  static render(input, options, data) {
    let snippet = new Snippet(input);
    let ast = snippet.parse();
    let fn = ast.compile(options);
    return fn(data);
  }
}

module.exports = Snippet;
