'use strict';

const kAst = Symbol('ast');
const Parser = require('./lib/Parser');
const colors = require('ansi-colors');

const styles = colors.theme({
  info: colors.cyan,
  success: colors.green,
  primary: colors.blue,
  warning: colors.yellow,
  danger: colors.red
});

class Session {
  constructor(string, options) {
    this.format = this.format.bind(this);
    this.options = { ...options, format: this.format };
    this.snippet = new Parser(string, options);
    this.string = string;
    this.lines = this.string.split(/\r*\n/);
    this.startLine = this.options.startLine || 0;
    this.endLine = (this.options.maxLines || this.lines.length) + this.startLine;
    this.stops = [];
    this.items = [];
    this.state = {
      // cursor: 0,
      // index: 0,
      // line: 0,
      // tabstop: 0,
      range: [this.startLine, this.endLine],
      i: 0,
    };

    this.styles = styles;
    if (this.options.theme) {
      this.styles = colors.create();
      this.styles.theme(this.options.theme);
    }
  }

  get focused() {
    return this.items[this.state.i];
  }

  /**
   * Move the cursor left or right in the input string
   */

  left() {
    this.state.cursor--;
  }
  right() {
    this.state.cursor++;
  }

  /**
   * Jump to the next or previous tabstop
   */

  prev() {
    let len = this.items.length;
    this.state.i = (this.state.i - (1 % len) + len) % len;
    return this.render();
  }

  next() {
    this.state.i = (this.state.i + 1) % this.items.length;
    return this.render();
  }

  /**
   * Scroll content up or down
   */

  // up() {
  //   this.state.index--;
  // }
  // down() {
  //   this.state.index++;
  // }

  /**
   * Increase or decrease the number of visible lines rendered.
   */

  // pageUp() {
  //   this.state.limit--;
  // }
  // pageDown() {
  //   this.state.limit++;
  // }

  updateFields() {
    let { tabstop, variable, zero } = this.snippet.fields;
    for (let [key, nodes] of tabstop) {
      this.stops.push(nodes);
      this.items.push(...nodes);
    }

    for (let [key, nodes] of variable) {
      this.stops.push(nodes);
      this.items.push(...nodes);
    }

    if (zero) {
      this.stops.push([zero]);
      this.items.push(zero);
    }
  }

  parse(...args) {
    if (this.ast) return this.ast;
    this.ast = this.snippet.parse(...args);
    this.updateFields();
    return this.ast;
  }

  format(state, history = []) {
    if (state.value === void 0) return this.styles.danger('<foo>');
    if (state.node.kind === 'text') {
      return state.value;
    }

    let focused = this.focused;
    let index = this.items.indexOf(state.node);
    console.log([index])

    // if (state.node.kind === 'tabstop') {
    //   return this.styles.warning(state.value);
    // }

    // if (state.node.kind === 'variable') {
    //   return this.styles.info(state.value);
    // }

    return state.value;
  }

  render(data = {}) {
    if (!this.fn) {
      let ast = this.parse();
      this.fn = ast.compile(this.options);
    }
    return this.fn(data);
  }

  visible(output) {
    return output.split(/\r*\n/).slice(...this.state.range).join('\n');
  }

  static get Session() {
    return Session;
  }

  static get Parser() {
    return Parser;
  }
}

module.exports = Session;

// // pass a string as the first argument
// const snippet = new Parser('console.log("$1");');

// console.log(snippet.render()); //=> 'console.log("");'

// snippet.set(1, 'It worked!');
// console.log(snippet.render()); //=> 'console.log("It worked!");'

// snippet.set(1, 'Warning!');
// console.log(snippet.render()); //=> 'console.log("Warning!");'

// const snippet2 = new Parser('Your username is: ${username:jonschlinkert}');
// snippet2.data.set('username', 'doowb');
// console.log(snippet2.render())


const snippet = `import React, { Component } from 'react';

export class \${1:\${TM_FILENAME/(.+)\\..+|.*/$1/:ComponentName}} extends Component {
  render() {
    return \${2:(
      \${3:<div>\${0}</div>}
    );}
  }
}

Foo: \${one}

Bar: \${two}

Baz: \${three}
`;

// const format = state => {
//   if (state.type !== 'text') {
//     // console.log(state.node);
//   }
//   return state.value;
// };

// const data = { name: 'Blah' };
// // const session = new Session('$1 ${1:${name:foo}} $3 $1 $user ${2:bar}', { format, data, zero: true });
// const session = new Session('$1 $name ${2:foo}', { format, data, zero: true });

// const render = data => {
//   console.log(session.visible(session.render(data)));
//   console.log('---');
// };

// // session.snippet.set(1, 'ONE')
// render({ _name: 'Whatever' });
// // session.snippet.set(3, 'THREEEE')
// // session.pageUp();
// // render();
// // session.snippet.set(2, 'TWOOO');
// // render();
// // render({ user: 'me' });
