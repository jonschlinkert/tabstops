'use strict';

const colors = require('ansi-colors');
const Session = require('..');
const string = [
  '{',
  '  "name": "${1:name}",',
  '  "file": "${TM_FILENAME/(\\/[^/]*?)$/$1/}",',
  // '  "file": "${TM_FILENAME/(\\/[^/]*?)$/${1:/upcase}/i}",',
  // '  "file": "${TM_FILENAME/.*\\/([^/]*?)$/${1:/upcase}/ig}",',
  // '  "file": "${TM_FILENAME/(.*)/$1/g}",',
  '  "description": "${2:${description:\'My amazing new project.\'}}",',
  '  "version": "${3:${version:0.1.0}}",',
  '  "repository": "${4:${owner}}/${name}",',
  '  "choose": "${5|foo,bar,baz|}",',
  '  "mirror": "${5}",',
  '  "mirror2": "$5",',
  '  "homepage": "https://github.com/${owner}/${name}",',
  '  "author": "${fullname} (https://github.com/${username})",',
  '  "bugs": {',
  '    "url": "https://github.com/${owner}/${name}/issues"',
  '  },',
  '  "main": "index.js",',
  '  "engines": {',
  '    "node": ">=${engine:10}"',
  '  },',
  '  "license": "${license:MIT}",',
  '  "scripts": {',
  '    "test": "mocha"',
  '  },',
  '  "keywords": ${keywords}',
  '}'
].join('\n');

const readline = require('readline');
const update = require('log-update');

const prompt = (input, options = {}) => {
  const { stdin, stdout } = process;
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const session = new Session(input, { ...options, decorate: true });

  readline.emitKeypressEvents(rl.input);
  if (stdin.isTTY) stdin.setRawMode(true);

  const close = () => {
    rl.close();

    let result = session.renderResult();
    if (options.onClose) {
      options.onClose(result);
    }
    process.exit();
  };

  rl.on('SIGINT', close);
  rl.on('line', close);
  rl.input.on('keypress', (input, event) => {
    if (event.name === 'y' && event.ctrl === true) {
      session.togglePlaceholders();
    } else if (event.code === '[5~') {
      session.pageup();
    } else if (event.code === '[6~') {
      session.pagedown();
    } else if (event.name === 'tab') {
      session[event.shift === true ? 'prev' : 'next']();
    } else if (event.name === 'left') {
      session.left();
    } else if (event.name === 'right') {
      session.right();
    } else if (event.name === 'up') {
      session[event.shift ? 'shiftup' : 'up']();
    } else if (event.name === 'down') {
      session[event.shift ? 'shiftdown' : 'down']();
    } else {
      let item = session.focused;

      if (event.name === 'backspace' || event.name === 'delete') {
        item.input = item.input.slice(0, -1);
      } else {
        item.input += input;
      }

      session.values.set(item.key, colors.unstyle(item.input));
    }

    update(session.render());
  });

  update(session.render());
};

const options = {
  fields: {
    keywords(value) {
      return `["${value.split(/,\s*/).join('", "')}"]`;
    }
    // name: {
    //   validate() {

    //   },
    //   format() {

    //   },
    //   result() {

    //   }
    // }
  },
  onClose(result) {
    console.log(result);
  },
  data: {
    _name: 'Brian',
    TM_FILENAME: __filename,
    ENV_FILENAME: 'index.js'
  }
};

prompt(string, options);

// const session = new Session(string);
// const ast = session.parse();
// const range = ast.nodes[3].loc.lines;

// const slice = (lines, start, end) => {
//   return start === end ? lines[start] : lines.slice(start, end);
// };

// console.log(slice(session.lines, ...range));
