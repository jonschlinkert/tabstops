'use strict';

const { StringPrompt } = require('enquirer');
const Session = require('./');

const increment = (i, keys = []) => {
  return i >= keys.length - 1 ? 0 : i + 1;
};

const decrement = (i, keys = []) => {
  return i <= 0 ? keys.length - 1 : i - 1;
};

class Snippet extends StringPrompt {
  constructor(options) {
    super(options);
    this.session = new Session(this.options.template, this.options);
    this.session.render();
    this.state.items = this.session.items;
    this.state.keys = this.state.items.map(item => item.key);
    this.state.completed = 0;
    this.item = this.state.items[0];
    this.cursorHide();
    console.log(this.state.keys)
  }

  moveCursor(n) {
    let item = this.getItem();
    this.cursor += n;
    item.cursor += n;
  }

  dispatch(input, kpress) {
    if (!kpress.code && !kpress.ctrl && input != null && this.getItem()) {
      this.append(input, kpress);
      return;
    }
    this.alert();
  }

  append(str) {
    let item = this.getItem();
    let prefix = item.input.slice(0, this.cursor);
    let suffix = item.input.slice(this.cursor);
    this.input = item.input = `${prefix}${str}${suffix}`;
    this.moveCursor(str.length);
    this.render();
  }

  delete(str = ' ') {
    let item = this.getItem();
    if (this.cursor <= 0 || !item.input) return this.alert();
    let suffix = item.input.slice(this.cursor);
    let prefix = item.input.slice(0, this.cursor - str.length);
    this.input = item.input = `${prefix}${suffix}`;
    this.moveCursor(-str.length);
    this.render();
  }

  first() {
    this.state.index = 0;
    return this.render();
  }

  last() {
    this.state.index = this.state.keys.length - 1;
    return this.render();
  }

  right() {
    if (this.cursor >= this.input.length) return this.alert();
    this.moveCursor(1);
    return this.render();
  }

  left() {
    if (this.cursor <= 0) return this.alert();
    this.moveCursor(-1);
    return this.render();
  }

  prev() {
    this.state.index = decrement(this.state.index, this.state.keys);
    this.getItem();
    return this.render();
  }

  next() {
    this.state.index = increment(this.state.index, this.state.keys);
    this.getItem();
    return this.render();
  }

  up() {
    return this.prev();
  }

  down() {
    return this.next();
  }

  getItem(name) {
    let { items, keys, index } = this.state;
    let item = items.find(ch => ch.name === keys[index]);
    if (item && item.input != null) {
      this.input = item.input;
      this.cursor = item.cursor;
    }
    this.item = item;
    return item;
  }

  // ====

  // prev() {
  //   this.session.prev();
  //   return this.render();
  // }

  // next() {
  //   this.session.next();
  //   return this.render();
  // }

  format(value) {
    let color = this.state.completed < 100 ? this.styles.warning : this.styles.success;
    if (this.state.submitted === true && this.state.completed !== 100) {
      color = this.styles.danger;
    }
    return color(`${this.state.completed}% completed`);
  }

  body() {
    let field = this.session.focused;

    console.log([field.kind])
    console.log([field.kind])
    console.log([field.kind])

    // if (field.kind === 'variable') {
    //   // this.session.snippet.fields.variable.set(field.key, this.input);
    // }

    // if (field.kind === 'tabstop') {
    //   this.session.snippet.fields.tabstop.set(field.key, this.input);
    // }

    return '\n' + this.session.render();
  }

  // render(...args) {

  //   console.log([{ input: this.state.input }])
  //   return super.render(...args);
  // }
}

const prompt = new Snippet({
  type: 'input',
  name: 'username',
  message: 'What is your username?',
  template: `{
    "name": "\${1:name}",
    "description": "\${description:'My amazing new project.'}",
    "version": "\${version:0.1.0}",
    "repository": "\${2:\${owner}}/\${name}",
    "homepage": "https://github.com/\${owner}/\${name}",
    "author": "\${fullname} (https://github.com/\${username})",
    "bugs": {
      "url": "https://github.com/\${owner}/\${name}/issues"
    },
    "main": "index.js",
    "engines": {
      "node": ">=\${engine:10}"
    },
    "license": "\${license:MIT}",
    "scripts": {
      "test": "mocha"
    },
    "keywords": ["\${3:keywords}"]
  }`
});

prompt.run()
  .then(console.log)
  .catch(console.log)
