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
  constructor(input) {
    super(input);
    this.tabstops = new Map();

    for (let key of Object.keys(rules)) {
      this.capture(key, rules[key]);
    }

    let loc = this.lexer.location();
    this.on('push', node => {
      if (!node.loc) loc(node);
      loc = this.lexer.location();
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
    this.handler('space', text);
    this.handler('text', text);

    this.handler('variable', node => new Variable(node));
    this.handler('choices', node => new Choices(node));
    this.handler('tabstop', node => {
      if (this.isInsideScope()) {
        node.value = node.match[0];
        return text(node);
      }
      node.tabstops = this.tabstops;
      return new Tabstop(node);
    });

    this.handler('placeholder', node => {
      let [, open, stop, variable, delim] = node.match;
      let tabstops = this.tabstops;
      let match = node.match;
      let block;

      if (stop && (delim === ':' || delim === void 0)) {
        block = new Tabstop({ nodes: [], tabstops, match });
        block.tabstop = Number(stop);
      }

      if (stop && delim === '/') {
        block = new PlaceholderTransform({ tabstops, match });
        block.tabstop = Number(stop);
      }

      if (!stop && delim === ':') {
        block = new Placeholder({ tabstops, match });
        block.variable = variable;
      }

      if (!stop && delim === '/') {
        block = new VariableTransform({ tabstops, match });
        block.variable = variable;
      }

      if (delim === '/') {
        this.pushScope(new Scope({ type: block.type, blocks: [block] }));
      }

      node.type = 'open_brace';
      node.value = open;
      node.output = '';
      node.open = true;

      loc(block);
      this.push(block);
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
}

module.exports = Snippet;
