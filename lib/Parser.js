'use strict';

const kAst = Symbol('ast');
const Events = require('events');
const nodes = require('./nodes');
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
  CHECKBOX_REGEX,
  CHOICES_CLOSE_REGEX,
  CHOICES_OPEN_REGEX,
  ESCAPED_CHAR_REGEX,
  FORMULA_REGEX,
  HELPER_REGEX,
  OPEN_REGEX,
  SQUARE_BRACKETS_REGEX,
  TABSTOP_PLACEHOLDER_REGEX,
  TABSTOP_REGEX,
  TABSTOP_TRANSFORM_REGEX,
  TEXT_REGEX,
  TRANSFORM_FORMAT_REGEX,
  VARIABLE_REGEX_DOT,
  VARIABLE_REGEX_NODOT
} = constants;

const {
  Block,
  Checkbox,
  Choices,
  Close,
  Format,
  Formula,
  Helper,
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
    this.loc = { index: 0, column: 0, line: 0 };
    let loc = this.location();

    this.ast = new Block(loc({
      type: this.options.type || 'root',
      source: Buffer.from(input),
      depth: 0
    }));

    this.stack = [this.ast];
    this.tokens = [];
    this.input = this.remaining = input;
    this.consumed = '';
    this.prev = null;

    this.values = {
      tabstop: this.options.tabstop || new Map(),
      variable: new Data(this.options.data)
    };

    this.fields = {
      tabstop: new Map(),
      variable: new Map(),
      zero: null
    };
  }

  set(key, value) {
    this.values.variable.set(key, value);
    return this;
  }
  has(key) {
    return this.values.variable.has(key);
  }
  get(key) {
    return this.values.variable.get(key);
  }
  delete(key) {
    this.values.variable.delete(key);
    return this;
  }

  field(node) {
    node.values = this.values;
    node.fields = this.fields;

    if (node.number === 0) {
      this.fields.zero = node;
      this.emit('field', node);
      return this;
    }

    let fields = this.fields[node.kind];
    if (fields) {
      union(fields, node.key, node);
      this.emit('field', node);
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
    this.block.push(node);
    this.tokens.push(node);
    this.field(node);

    if (node.nodes) {
      this.stack.push(node);
      this.emit('open', node);
    }

    this.emit('push', node);
    this.prev = node;
    return node;
  }

  pop() {
    if (!this.block.parent) {
      throw new Error('Unclosed block');
    }
    this.block.onClose(this.options);
    this.emit('close', this.stack.pop());
    return this.block;
  }

  isInside(Node) {
    return this.stack.some(node => node instanceof Node);
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
      if ((token = this.scan(CHOICES_OPEN_REGEX))) {
        this.push(loc(new Choices({ match: token.match })));
        this.push(new Open(token));
        return true;
      }

      if ((token = this.scan(CHOICES_CLOSE_REGEX))) {
        if (this.block.type !== 'choices') {
          this.push(new Text(token));
          return true;
        }

        this.push(new Close(token));
        this.pop();
        return true;
      }

      if ((token = this.scan(TABSTOP_REGEX))) {
        this.push(new Tabstop(token));
        return true;
      }
    }

    if ((token = this.scan(FORMULA_REGEX))) {
      this.push(new Formula(token));
      return true;
    }

    if ((token = this.scan(VARIABLE_REGEX))) {
      this.push(new Variable(token));
      return true;
    }

    if ((token = this.scan(CHECKBOX_REGEX))) {
      this.push(new Checkbox(token));
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
      if (token.match[3]) {
        let match = HELPER_REGEX.exec(token.match[2]);
        if (match) {
          token.helperMatch = match;
          this.push(new Helper(token));
          return true;
        }

        // Now that we're here, we know none of the valid block
        // types have been matched. Thus, if "}" was matched by this
        // regex, we know this is not a valid tabstop or variable,
        // so treat it as a text node
        this.push(new Text(token));
        return true;
      }

      this.push(loc(new Block({ match: token.match })));
      this.push(new Open(token));
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

    if (value === '\\' && !this.eos()) {
      value += this.next();
    }

    if (this.isInside(Transform) && value === '/') {
      this.push(loc({ type: 'slash', value }));
      return;
    }

    if (this.block.type === 'choices') {
      if (!(value === '|' && this.peek() === '}')) {
        this.push(loc({ type: value === ',' ? 'comma' : 'text', value }));
        return;
      }
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

    if (this.options.zero && !this.values.tabstop.has(0)) {
      this.remaining = '$0';
      this.advance();
    }

    this.closeUnclosedBlocks();
    this[kAst] = loc(this.ast);
    return this[kAst];
  }

  compile(options) {
    if (!this.fn) {
      let opts = { ...this.options, ...options };
      let ast = this.parse();
      this.fn = ast.compile(opts);
    }
    return this.fn;
  }

  render(data, options) {
    let fn = this.compile(options);
    return fn(data);
  }

  get block() {
    return this.stack[this.stack.length - 1];
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
      let snippet = new this(input, options);
      let ast = snippet.parse();
      let fn = ast.compile(options);
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
