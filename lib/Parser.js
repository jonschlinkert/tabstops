'use strict';

const kAst = Symbol('ast');
const Events = require('events');
const nodes = require('./nodes');
const Field = require('./Field');
const Scope = require('./Scope');
const Data = require('./Data');
const constants = require('./constants');
const { Location, Position } = require('./Location');

const assert = (value, message, Ctor = Error) => {
  if (!value) {
    throw new Ctor(message);
  }
};

const union = (map, key, node) => {
  if (!map.has(key)) {
    map.set(key, [node]);
  } else {
    map.set(key, map.get(key).concat(node));
  }
};

const {
  CHOICES_REGEX,
  ESCAPED_CHAR_REGEX,
  NEWLINE_REGEX,
  OPEN_REGEX,
  SQUARE_BRACKETS_REGEX,
  TABSTOP_PLACEHOLDER_REGEX,
  TABSTOP_REGEX,
  TABSTOP_TRANSFORM_REGEX,
  TRANSFORM_FORMAT_REGEX,
  TEXT_REGEX,
  VARIABLE_REGEX_DOT,
  VARIABLE_REGEX_NODOT
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

    this.data = new Data(this.options.data);
    this.stops = this.options.stops || new Map();
    this.fields = {
      tabstop: new Map(),
      variable: new Map(),
      zero: null
    };

    // this.names = this.options.names || new Map();
    // this.variables = new Map();
    // this.tabstops = new Map();
  }

  set(key, value) {
    this.data.set(key, value);
    return this;
  }
  has(key) {
    return this.data.has(key);
  }
  get(key) {
    return this.data.get(key);
  }
  delete(key) {
    this.data.delete(key);
    return this;
  }

  field(node) {
    node.data = this.data;
    node.stops = this.stops;
    node.fields = this.fields;

    if (node.number === 0) {
      this.fields.zero = node;
      return this;
    }

    let fields = this.fields[node.kind];
    if (fields) {
      union(fields, node.key, node);
    }

    return this;
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

    Reflect.defineProperty(node, 'root', { value: this.ast });
    this.block = this.stack[this.stack.length - 1];
    this.block.push(node);
    this.field(node);

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
    if (this.block instanceof Node) return true;
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
    let varRegex = VARIABLE_REGEX_NODOT;

    if (this.options.dotVariables === true) {
      varRegex = VARIABLE_REGEX_DOT;
    }

    let {
      VARIABLE_PLACEHOLDER_REGEX,
      VARIABLE_REGEX,
      VARIABLE_TRANSFORM_REGEX
    } = varRegex;

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

      if ((token = this.scan(TRANSFORM_FORMAT_REGEX))) {
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
      this.push(loc(new TabstopPlaceholder({ match: token.match })));
      this.push(new Open(token));
      return true;
    }

    if ((token = this.scan(TABSTOP_TRANSFORM_REGEX))) {
      this.push(loc(new TabstopTransform({ match: token.match })));
      this.push(new Open(token));
      return true;
    }

    if ((token = this.scan(VARIABLE_PLACEHOLDER_REGEX))) {
      this.push(loc(new VariablePlaceholder({ match: token.match })));
      this.push(new Open(token));
      return true;
    }

    if ((token = this.scan(VARIABLE_TRANSFORM_REGEX))) {
      this.push(loc(new VariableTransform({ match: token.match })));
      this.push(new Open(token));
      return true;
    }

    if ((token = this.scan(OPEN_REGEX))) {
      // if "}" was matched, we know this is not a valid tabstop or
      // variable, so treat it as a text node
      if (token.match[2]) {
        this.push(new Text(token));
        return true;
      }

      this.push(loc(new Block({ match: token.match })));
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
    if (this[kAst]) return this[kAst];
    let loc = this.location();

    // scan for byte-order-mark
    let token = this.scan(/^\ufeff/, 'bom');
    if (token) {
      this.push(new Node(token));
    }

    // parse the rest of the string
    while (!this.eos()) this.advance();

    if (this.options.zero && !this.stops.has(0)) {
      this.remaining = '$0';
      this.advance();
    }

    this.closeUnclosedBlocks();
    this[kAst] = loc(this.ast);
    return this[kAst];
  }

  compile(options) {
    let opts = { ...this.options, ...options };
    let ast = this.parse();
    return ast.compile(opts);
  }

  render(data, options) {
    let fn = this.compile({ ...options, data });
    return fn(data);
  }

  static get parse() {
    return (input, options) => {
      let snippet = new this(input, options);
      return snippet.parse();
    };
  }

  static get compile() {
    return (input, options = {}) => {
      let snippet = new this(input, options);
      let ast = snippet.parse();
      return ast.compile(options);
    };
  }

  static get render() {
    return (input, data, options) => {
      let opts = { ...options, data };
      let snippet = new this(input, opts);
      let ast = snippet.parse();
      let fn = ast.compile(opts);
      return fn(data);
    };
  }

  static get Data() {
    return Data;
  }

  static get Parser() {
    return Parser;
  }
}

module.exports = Parser;
