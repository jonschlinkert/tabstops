'use strict';

const Events = require('events');
const nodes = require('./nodes');
const Scope = require('./Scope');
const constants = require('./constants');
const { Location, Position } = require('./location');

const assert = (value, message, Ctor = Error) => {
  if (!value) {
    throw new Ctor(message);
  }
};

const {
  ESCAPED_CHAR_REGEX,
  CHOICES_REGEX,
  TABSTOP_REGEX,
  SQUARE_BRACKETS_REGEX,
  FORMAT_STRING_REGEX,
  VARIABLE_REGEX,
  TABSTOP_PLACEHOLDER_REGEX,
  TABSTOP_TRANSFORM_REGEX,
  VARIABLE_PLACEHOLDER_REGEX,
  VARIABLE_TRANSFORM_REGEX,
  OPEN_REGEX,
  NEWLINE_REGEX,
  TEXT_REGEX,
} = constants;

const {
  Block,
  Choices,
  Close,
  Format,
  Node,
  Open,
  Tabstop,
  TabstopPlaceholder,
  TabstopTransform,
  Text,
  Transform,
  Variable,
  VariablePlaceholder,
  VariableTransform
} = nodes;

class Parser extends Events {
  constructor(input, options) {
    super();
    this.options = { ...options };
    this.loc = { index: 0, column: 0, line: 1 };
    let loc = this.location();
    this.scope = new Scope({ type: 'root' });
    this.ast = new Block(loc({ type: 'root', source: Buffer.from(input) }));
    this.ast.depth = 0;
    this.scopes = [this.scope];
    this.stack = [this.ast];
    this.block = this.ast;
    this.input = this.remaining = input;
    this.consumed = '';
    this.prev = null;

    this.tabstops = new Map();
    this.variables = new Map();
    this.fields = new Map();
  }

  location() {
    const start = new Position(this.loc);

    return node => {
      node.loc = new Location(start, new Position(this.loc));
      return node;
    };
  }

  updateLocation(value, len = value.length) {
    let i = value.lastIndexOf('\n');
    this.loc.index += len;
    this.loc.column = ~i ? len - i : (this.loc.column + len);
    this.loc.line += Math.max(0, value.split('\n').length - 1);
  }

  consume(value, len = value.length) {
    this.updateLocation(value, len);
    this.remaining = this.remaining.slice(len);
    this.consumed += value;
    return value;
  }

  peek() {
    return this.input[this.loc.index + 1];
  }

  eos() {
    return this.loc.index >= this.input.length;
  }

  next() {
    return this.consume(this.remaining[0]);
  }

  match(regex) {
    assert(regex instanceof RegExp, 'Expected a regular expression');
    assert(regex.source[0] === '^', 'Expected regex to start with "^"');

    let match = regex.exec(this.remaining);
    if (!match) return null;

    assert(match[0] !== '', 'Regex should not match an empty string', SyntaxError);
    this.consume(match[0]);
    return match;
  }

  scan(regex, type = 'text') {
    let loc = this.location();
    let match = this.match(regex);
    if (match) {
      return loc({ type, value: match[0], match });
    }
  }

  push(node) {
    if (this.prev && this.prev.type === 'text' && node.type === 'text') {
      this.prev.append(node);
      return;
    }

    if (!(node instanceof Node)) {
      node = node.type === 'text' ? new Text(node) : new Node(node);
    }

    this.block = this.stack[this.stack.length - 1];
    this.block.push(node);

    this.block.fields = this.fields;
    node.fields = this.fields;

    if (node.nodes) {
      this.stack.push(node);
      this.block = node;
      this.emit('open', node);
    }

    this.emit('push', node);
    this.prev = node;
    return node;
  }

  pop() {
    if (this.block.type === 'root') {
      console.log(this.ast)
      throw new Error('Unclosed block');
    }

    let scope = this.scopes[this.scopes.length - 1];
    let block = this.stack.pop();
    block.onClose(this.options);

    if (scope.blocks[0] === block) {
      this.popScope();
    }

    this.emit('close', block);
    this.block = this.stack[this.stack.length - 1];
    return block;
  }

  isInside(Node) {
    if (this.block instanceof Node) {
      return true;
    }

    // slice of the current block (since we already checked it),
    // and "root", since everything is inside root.
    let stack = this.stack.slice(1, -1);
    if (stack.length > 0) {
      return stack.some(node => node instanceof Node);
    }
    return false;
  }

  nextMatch() {
    let loc = this.location();

    let token = this.scan(ESCAPED_CHAR_REGEX);
    if (token) {
      if (this.options.unescape === true) {
        token.value = token.value.slice(1);
      }
      this.push(new Text(token));
      return true;
    }

    if (this.isInside(Transform)) {
      if ((token = this.scan(SQUARE_BRACKETS_REGEX))) {
        this.push(new Text(token));
        return true;
      }

      if ((token = this.scan(FORMAT_STRING_REGEX))) {
        this.push(new Format(token));
        return true;
      }
    } else {
      if ((token = this.scan(CHOICES_REGEX))) {
        this.push(new Choices(token));
        return true;
      }

      if ((token = this.scan(TABSTOP_REGEX))) {
        this.push(new Tabstop(token));
        return true;
      }
    }

    if ((token = this.scan(VARIABLE_REGEX))) {
      this.push(new Variable(token));
      return true;
    }

    if ((token = this.scan(TABSTOP_PLACEHOLDER_REGEX))) {
      this.push(loc(new TabstopPlaceholder()));
      console.log(token)
      this.push(new Open(token));
      return true;
    }

    if ((token = this.scan(TABSTOP_TRANSFORM_REGEX))) {
      this.push(loc(new TabstopTransform()));
      this.push(new Open(token));
      return true;
    }

    if ((token = this.scan(VARIABLE_PLACEHOLDER_REGEX))) {
      this.push(loc(new VariablePlaceholder()));
      this.push(new Open(token));
      return true;
    }

    if ((token = this.scan(VARIABLE_TRANSFORM_REGEX))) {
      this.push(loc(new VariableTransform()));
      this.push(new Open(token));
      return true;
    }

    if ((token = this.scan(OPEN_REGEX))) {
      this.push(loc(new Block()));
      this.push(new Open(token));
      return true;
    }

    if ((token = this.scan(NEWLINE_REGEX))) {
      token.value = '\n';
      this.loc.line++;
      this.push(new Text(token));
      return true;
    }

    if ((token = this.scan(TEXT_REGEX))) {
      this.push(new Text(token));
      return true;
    }

    return false;
  }

  nextChar() {
    let loc = this.location();
    let value = this.next();

    if (value === '"' || value === '\'') {
      let open = value;
      while (!this.eos() && this.peek() !== open) {
        let char = this.next();
        if (char === '\\') {
          char += this.next();
        }
        value += char;
      }
      value += this.next();
      this.push(new Text(loc({ value })));
      return;
    }

    if (this.isInside(Transform) && value === '/') {
      this.push(loc({ type: 'slash', value }));
      return;
    }

    let node = loc({ value });
    if (value === '}') {
      if (this.block.type === 'root') {
        this.push(new Text(node));
      } else {
        this.push(new Close(node));
        this.pop();
      }
      return;
    }

    this.push(new Text(node));
  }

  advance() {
    return this.nextMatch() || this.nextChar();
  }

  closeUnclosedBlocks() {
    while (this.stack.length > 1) {
      let block = this.stack.pop();
      block.invalid = true;

      if (!block.nodes.some(node => node.nodes)) {
        block.replace(new Node({ type: 'text', value: block.stringify() }));
      }
    }
  }

  parse() {
    let loc = this.location();

    // scan for byte-order-mark
    let token = this.scan(/^\ufeff/, 'bom');
    if (token) {
      this.push(new Node(token));
    }

    // parse the rest of the string
    while (!this.eos()) this.advance();
    this.closeUnclosedBlocks();
    return loc(this.ast);
  }

  static parse(input, options) {
    let parser = new Parser(input, options);
    return parser.parse();
  }

  static compile(input, options) {
    let parser = new Parser(input, options);
    let ast = parser.parse();
    return ast.compile(options);
  }

  static render(input, data, options = {}) {
    let parser = new Parser(input, options);
    let ast = parser.parse();
    let fn = ast.compile(options);
    return fn(data, options.tabstops);
  }
}

module.exports = Parser;
