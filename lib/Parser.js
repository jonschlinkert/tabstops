'use strict';

const kAst = Symbol('ast');
const Events = require('events');
const nodes = require('./nodes');
const Data = require('./Data');
const constants = require('./constants');
const { Location, Position } = require('./Location');
const { union, define, isObject } = require('./utils');

const assert = (value, message, Ctor = Error) => {
  if (!value) {
    throw new Ctor(message);
  }
};

const {
  BOM_REGEX,
  CHECKBOX_REGEX,
  CHOICES_CLOSE_REGEX,
  CHOICES_OPEN_REGEX,
  ESCAPED_CHAR_REGEX,
  FORMULA_REGEX,
  HELPER_REGEX,
  OPEN_REGEX,
  RADIO_REGEX,
  SQUARE_BRACKETS_REGEX,
  STATIC_FIELD_REGEX,
  TABSTOP_PLACEHOLDER_REGEX,
  TABSTOP_REGEX,
  TABSTOP_TRANSFORM_REGEX,
  TEXT_REGEX,
  TRANSFORM_FORMAT_REGEX,
  VARIABLE_REGEX_DOT,
  VARIABLE_REGEX_NODOT
} = constants;

class Parser extends Events {
  constructor(input = '', options = {}) {
    super();
    this.extensions = new Map();
    this.handlers = [];
    let n = { ...nodes, ...options.nodes };
    for (let key of Object.keys(n)) {
      define(this, key, n[key]);
    }
    this.reset(input, options);
    this.addDefaultHandlers();
    this.registerExtensions();
  }

  reset(input, options) {
    this.options = { ...options };
    this.transforms = 0;

    this.loc = { index: 0, column: 0, line: 0 };
    let loc = this.location();

    this.ast = new this.Block(loc({
      type: this.options.type || 'root',
      source: Buffer.from(input),
      depth: 0
    }));

    this.stack = [this.ast];
    this.tokens = [];
    this.prev = null;

    this.input = this.remaining = input;
    this.consumed = '';

    this.tabstops = this.options.tabstop || new Map();
    this.variables = new Data(this.options.data);

    this.fields = {
      tabstop: new Map(),
      variable: new Map(),
      zero: null
    };
  }

  field(node) {
    node.tabstops = this.tabstops;
    node.variables = this.variables;
    node.fields = this.fields;

    if (typeof this.options.decorate === 'function') {
      this.options.decorate(node, this);
    }

    if (node.number === 0) {
      this.fields.zero = node;
      this.emit('field', node);
      return this;
    }

    let fields = this.fields[node.kind];
    if (fields) {
      if (node.kind === 'tabstop') {
        let stops = fields.get(node.key);
        let size = stops ? stops.size : 0;
        node.occurrence = size + 1;
      }

      union(fields, node.key, node);
      this.emit('field', node);
    }

    return this;
  }

  tabstop(n, value) {
    if (value === void 0) {
      return this.tabstops.get(n);
    }
    this.tabstops.set(n, value);
    return value;
  }

  variable(name, value) {
    if (value === void 0) {
      return this.variables.get(name);
    }
    this.variables.set(name, value);
    return value;
  }

  location() {
    const start = new Position(this.loc);

    return node => {
      node.loc = new Location(start, new Position(this.loc));
      return node;
    };
  }

  updateLocation(value, len) {
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

    if (!(node instanceof this.Node)) {
      node = node.type === 'text' ? new this.Text(node) : new this.Node(node);
    }

    Reflect.defineProperty(node, 'root', { value: this.ast });
    this.block.push(node);
    this.tokens.push(node);
    this.field(node);

    if (node.nodes) {
      this.stack.push(node);
      this.emit('open', node);
    }

    if (typeof this.options.onPush === 'function') {
      this.options.onPush(node, this);
    }

    this.emit('push', node);
    this.prev = node;
    return node;
  }

  pop() {
    if (typeof this.options.onClose === 'function') {
      this.options.onClose(this.block, this);
    }

    this.block.onClose(this.options);
    this.emit('close', this.stack.pop());
    return this.block;
  }

  isInside(AncestorNode) {
    return this.stack.some(node => node instanceof AncestorNode);
  }

  handler(name, regex, fn, once = false) {
    if (isObject(name)) {
      this.handlers.push({ ...name });
    } else {
      this.handlers.push({ name, regex, fn, once });
    }
    return this;
  }

  before(key, { name, regex, fn, once = false }) {
    let index = this.handlers.findIndex(h => h.name === key);
    this.handlers.splice(index, 0, { name, regex, fn, once });
    return this;
  }

  after(key, { name, regex, fn, once = false }) {
    let index = this.handlers.findIndex(h => h.name === key);
    this.handlers.splice(index + 1, 0, { name, regex, fn, once });
    return this;
  }

  addDefaultHandlers() {
    let varRegex = VARIABLE_REGEX_NODOT;
    let token;

    if (this.options.dot !== false) {
      varRegex = VARIABLE_REGEX_DOT;
    }

    let {
      VARIABLE_PLACEHOLDER_REGEX,
      VARIABLE_REGEX,
      VARIABLE_TRANSFORM_REGEX
    } = varRegex;

    this.handler('bom', BOM_REGEX, token => new this.Node({ ...token, type: 'bom' }), true);
    this.handler('escaped', ESCAPED_CHAR_REGEX, (token, loc) => {
      if (this.options.unescape === true) {
        token.value = token.value.slice(1);
      }
      this.push(new this.Text(token));
      return true;
    });

    this.handler('bracket', null, () => {
      if (this.transforms > 0) {
        if ((token = this.scan(SQUARE_BRACKETS_REGEX))) {
          this.push(new this.Text(token));
          return true;
        }
      }
    });

    this.handler('choices', null, (_, loc) => {
      if (this.transforms === 0) {
        if ((token = this.scan(CHOICES_OPEN_REGEX))) {
          this.push(loc(new this.Choices({ match: token.match })));
          this.push(new this.Open(token));
          return true;
        }
        if ((token = this.scan(CHOICES_CLOSE_REGEX))) {
          if (this.block.type !== 'choices') {
            this.push(new this.Text(token));
            return true;
          }
          this.push(new this.Close(token));
          this.pop();
          return true;
        }
      }
    });

    this.handler('tabstop', null, (_, loc) => {
      if (this.transforms === 0) {
        if ((token = this.scan(TABSTOP_PLACEHOLDER_REGEX))) {
          this.push(loc(new this.TabstopPlaceholder({ match: token.match })));
          this.push(new this.Open(token));
          return true;
        }
        if ((token = this.scan(TABSTOP_TRANSFORM_REGEX))) {
          this.transforms++;
          this.push(loc(new this.TabstopTransform({ match: token.match })));
          this.push(new this.Open(token));
          return true;
        }
        if ((token = this.scan(TABSTOP_REGEX))) {
          this.push(new this.Tabstop(token));
          return true;
        }
      }
    });

    this.handler('variable', null, (_, loc) => {
      if (this.transforms === 0) {
        if ((token = this.scan(VARIABLE_REGEX))) {
          this.push(new this.Variable(token));
          return true;
        }
        if ((token = this.scan(VARIABLE_PLACEHOLDER_REGEX))) {
          this.push(loc(new this.VariablePlaceholder({ match: token.match })));
          this.push(new this.Open(token));
          return true;
        }
        if ((token = this.scan(VARIABLE_TRANSFORM_REGEX))) {
          this.transforms++;
          this.push(loc(new this.VariableTransform({ match: token.match })));
          this.push(new this.Open(token));
          return true;
        }
      }
    });

    this.handler('transform-format', null, () => {
      if (this.transforms > 0) {
        if ((token = this.scan(TRANSFORM_FORMAT_REGEX))) {
          this.push(new this.Format(token));
          return true;
        }
      }
    });

    this.handler('unknown-block', null, (_, loc) => {
      if ((token = this.scan(OPEN_REGEX))) {
        if (token.match[3]) {
          let match = HELPER_REGEX.exec(token.match[2]);
          if (match) {
            token.helperMatch = match;
            this.push(new this.Helper(token));
            return true;
          }
          this.push(new this.Text(token));
          return true;
        }
        this.push(loc(new this.Block({ match: token.match })));
        this.push(new this.Open(token));
        return true;
      }
    });
    this.handler('text', TEXT_REGEX, token => new this.Text(token));
  }

  registerExtensions() {
    this.extensions.set('formula', {
      before: 'unknown-block',
      regex: FORMULA_REGEX,
      fn: token => new this.Formula(token)
    });

    this.extensions.set('checkbox', {
      before: 'unknown-block',
      regex: CHECKBOX_REGEX,
      fn: token => new this.Checkbox(token)
    });

    this.extensions.set('radio', {
      before: 'unknown-block',
      regex: RADIO_REGEX,
      fn: token => new this.Radio(token)
    });

    this.extensions.set('static', {
      before: 'unknown-block',
      regex: STATIC_FIELD_REGEX,
      fn: token => new this.Static(token)
    });
  }

  addExtensions(names) {
    if (names === true || names === '*') {
      names = [...this.extensions.keys()];
    }

    let keys = [].concat(names || []);
    for (let [name, extension] of [...this.extensions]) {
      extension.name = name;

      if (!keys.includes('*') && !keys.includes(name)) {
        continue;
      }

      if (extension.before) {
        this.before(extension.before, extension);
        continue;
      }

      if (extension.after) {
        this.after(extension.after, extension);
        continue;
      }

      this.handle(extension);
    }
  }

  nextMatch() {
    if (this.eos()) return false;
    let loc = this.location();

    for (let i = 0; i < this.handlers.length; i++) {
      let { regex, fn, once } = this.handlers[i];

      if (once === true) {
        this.handlers.splice(i, 1);
      }

      if (regex) {
        let token = this.scan(regex);
        if (token) {
          let node = fn(token, loc);
          if (node === true) return true;
          if (node) {
            this.push(node);
            return true;
          }
        }
        continue;
      }

      if (fn(null, loc) === true) {
        return true;
      }
    }

    return false;
  }

  nextChar() {
    let loc = this.location();
    let value = this.next();

    if (value === '\\' && !this.eos()) {
      value += this.next();
    }

    if (this.isInside(this.Transform) && value === '/') {
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
        this.push(new this.Text(node));
      } else {
        if (this.block.isTransform) {
          this.transforms--;
        }

        this.push(new this.Close(node));
        this.pop();
      }
    } else {
      this.push(new this.Text(node));
    }
  }

  advance() {
    return this.nextMatch() || this.nextChar();
  }

  closeUnclosedBlocks() {
    while (this.stack.length > 1) {
      let block = this.stack.pop();
      block.invalid = true;

      if (!block.nodes.some(node => node.nodes)) {
        block.replace(new this.Node({ type: 'text', value: block.stringify() }));
      }
    }
  }

  parse(input, options) {
    if (!input && !options && this[kAst]) return this[kAst];
    if (input) {
      this.reset(input, options);
    }

    if (this.options.extensions) {
      this.addExtensions(this.options.extensions);
    }

    let loc = this.location();

    // parse the rest of the string
    while (!this.eos()) this.advance();

    if (this.options.zero && !this.tabstops.has(0)) {
      this.remaining = '$0';
      this.input += '$0';
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
    return this.compile(options)(data);
  }

  get block() {
    return this.stack[this.stack.length - 1];
  }

  static get parse() {
    return (input, options) => {
      let parser = new this(input, options);
      return parser.parse();
    };
  }

  static get compile() {
    return (input, options = {}) => {
      let parser = new this(input, options);
      let ast = parser.parse();
      return ast.compile(options);
    };
  }

  static get render() {
    return (input, data, options) => {
      let parser = new this(input, options);
      let ast = parser.parse();
      let fn = ast.compile(options);
      return fn(data);
    };
  }

  static get Parser() {
    return Parser;
  }
}

module.exports = Parser;
