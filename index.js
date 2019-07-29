'use strict';

const Events = require('events');
const colors = require('ansi-colors');
const Parser = require('./lib/Parser');

const sortMap = map => {
  const newMap = new Map();
  const keys = [...map.keys()];
  keys.sort((a, b) => (String(a).localeCompare(String(b))));
  for (let key of keys) {
    newMap.set(key, map.get(key));
  }
  return newMap;
};

class Session extends Events {
  constructor(string, options) {
    super();
    this.options = { ...options };
    this.snippet = new Parser(string, options);
    this.firsts = [];
    this.items = [];
    this.index = 0;
    this.display = 0;

    this.fields = this.snippet.fields;
    this.variables = this.snippet.values.variable;
    this.tabstops = this.snippet.values.tabstop;

    if (this.options.decorate) {
      this.snippet.on('field', item => {
        item.cursor = 0;
        item.input = '';
        item.output = '';
        item.format = this.format(item);
        this.emit('field', item);
      });
    }
  }

  format(item) {
    return (state, history) => {
      let output = state.value;

      if (!item.isValue(output)) {
        output = item.input;
      }

      if (this.display > 0 && this.display < 4) {
        return this.showPlaceholders(item, output);
      }

      let fields = this.options.fields || {};
      let field = fields[item.key];

      if (typeof field === 'function') {
        output = field(output);
      }

      if (this.closed) {
        let { value, resolved } = state;
        let { name, emptyPlaceholder } = item;

        if (resolved === 'name' && emptyPlaceholder && name === value) {
          return '';
        }

        return output;
      }

      let style = item.kind === 'tabstop'
        ? colors.unstyle.green
        : colors.unstyle.cyan;

      if (this.focused === item) {
        style = style.bold.underline;
      }

      return style(output);
    };
  }

  first() {
    this.index = 0;
    return this.render();
  }

  last() {
    this.index = this.firsts.length - 1;
  }

  prev() {
    this.index = (this.index - (1 % this.length) + this.length) % this.length;
  }

  next() {
    this.index = (this.index + 1) % this.length;
  }

  left() {
    this.cursor--;
  }
  right() {
    this.cursor++;
  }

  up() {
    this.prev();
  }
  down() {
    this.next();
  }

  addItems() {
    let { tabstop, variable, zero } = this.snippet.fields;

    for (let [, nodes] of sortMap(tabstop)) {
      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (node.parent && node.parent.type === 'root') {
          this.firsts.push(node);
          break;
        }
      }
      this.items.push(...nodes);
    }

    for (let [, nodes] of variable) {
      // let first = false;

      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];

        // if (node.isTransform) {
        //   this.firsts.push(node);
        //   continue;
        // }

        // if (!first && node.parent && node.parent.type === 'root') {
        if (node.parent && node.parent.type === 'root') {
          // first = true;
          this.firsts.push(node);
          break;
        }
      }

      this.items.push(...nodes);
    }

    if (zero) {
      this.firsts.push(zero);
      this.items.push(zero);
    }
  }

  parse(...args) {
    delete this.fn;
    this.ast = this.snippet.parse();
    this.addItems();
    return this.ast;
  }

  compile() {
    if (!this.fn) {
      let ast = this.parse();
      this.fn = ast.compile(this.options);
    }
    return this.fn;
  }

  render(data) {
    this.fn = this.compile();
    return this.fn(data);
  }

  togglePlaceholders() {
    this.display = this.display < 3 ? this.display + 1 : 0;
  }

  showPlaceholders(item, value) {
    let style = colors[item.kind === 'tabstop' ? 'blue' : 'green'];

    if (this.display === 1 && item.kind === 'tabstop') {
      return style(item.stringify());
    }

    if (this.display === 2 && item.kind === 'variable') {
      return style(item.stringify())
    }

    if (this.display === 3) {
      return style(item.stringify());
    }

    return value;
  }

  get values() {
    return this.focused.kind === 'tabstop' ? this.tabstops : this.variables;
  }

  get focused() {
    return this.firsts[this.index];
  }

  get length() {
    return this.firsts.length;
  }

  static get Session() {
    return Session;
  }

  static get Parser() {
    return Parser;
  }
}

module.exports = Session;

const string = [
  '{',
  '  "name": "\${name:}",',
  '  "file": "\${TM_FILENAME/(\\/[^/]*?)$/${1:/upcase}/i}",',
  '  "file": "\${TM_FILENAME/.*\\/([^/]*?)$/${1:/upcase}/ig}",',
  '  "file": "${TM_FILENAME/(.*)/$1/g}",',
  '  "description": "\${2:\${description:\'My amazing new project.\'}}",',
  '  "version": "\${3:\${version:0.1.0}}",',
  '  "repository": "\${4:\${owner}}/\${name}",',
  '  "name": "\${1:\${fooo}}",',
  '  "homepage": "https://github.com/\${owner}/\${name}",',
  '  "author": "\${fullname} (https://github.com/\${username})",',
  '  "bugs": {',
  '    "url": "https://github.com/\${owner}/\${name}/issues"',
  '  },',
  '  "main": "index.js",',
  '  "engines": {',
  '    "node": ">=\${engine:10}"',
  '  },',
  '  "license": "\${license:MIT}",',
  '  "scripts": {',
  '    "test": "mocha"',
  '  },',
  '  "keywords": \${keywords}',
  '}',
].join('\n');

const readline = require('readline');
const update = require('log-update');
const header = (message = '') => colors.bold.underline(message) + '\n';

const prompt = (input, options) => {
  const { stdin, stdout } = process;
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const session = new Session(input, { ...options, decorate: true });

  readline.emitKeypressEvents(rl.input);
  if (stdin.isTTY) stdin.setRawMode(true);

  const state = { index: 0 };
  const close = () => {
    session.closed = true;
    update(session.render());
    rl.close();
    process.exit();
  };

  rl.on('SIGINT', close);
  rl.on('line', close);
  rl.input.on('keypress', (input, event) => {
    if (event.name === 'y' && event.ctrl === true) {
      session.togglePlaceholders();
    } else if (event.name === 'tab') {
      session[event.shift === true ? 'prev' : 'next']();

    } else if (event.name === 'left') {
      session.left();
    } else if (event.name === 'right') {
      session.right();

    } else if (event.name === 'up') {
      session.up();
    } else if (event.name === 'down') {
      session.down();

    } else {
      let item = session.focused;
      let prev = session.values.get(item.key);
      let fields = session.fields[item.kind];
      let items = fields.get(item.key);

      if (event.name === 'backspace' || event.name === 'delete') {
        item.input = item.input.slice(0, -1);
      } else {
        item.input += input;
      }

      if (item.isTransform) {
        session.values.set(item.key, colors.unstyle(item.input || item.raw));
      } else {
        session.values.set(item.key, colors.unstyle(item.input));
      }
    }

    update(session.render());
  });

  update(session.render());
};

const options = {
  fields: {
    keywords(value) {
      return `["${value.split(/,\s*/).join('", "')}"]`;
    },
    // name: {
    //   validate() {

    //   },
    //   format() {

    //   },
    //   result() {

    //   }
    // }
  },
  data: {
    _name: 'Brian',
    TM_FILENAME: __filename,
    ENV_FILENAME: 'index.js',
  }
}


prompt(string, options);
