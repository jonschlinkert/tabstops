'use strict';

const colors = require('ansi-colors');
const Session = require('..');
const string = [
  '{',
  '  "name": "${name:}",',
  '  "file": "${TM_FILENAME/(\\/[^/]*?)$/${1:/upcase}/i}",',
  '  "file": "${TM_FILENAME/.*\\/([^/]*?)$/${1:/upcase}/ig}",',
  '  "file": "${TM_FILENAME/(.*)/$1/g}",',
  '  "description": "${2:${description:\'My amazing new project.\'}}",',
  '  "version": "${3:${version:0.1.0}}",',
  '  "repository": "${4:${owner}}/${name}",',
  '  "name": "${1:${fooo}}",',
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

const prompt = (input, options) => {
  const { stdin, stdout } = process;
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const session = new Session(input, { ...options, decorate: true });

  readline.emitKeypressEvents(rl.input);
  if (stdin.isTTY) stdin.setRawMode(true);

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
  data: {
    _name: 'Brian',
    TM_FILENAME: __filename,
    ENV_FILENAME: 'index.js'
  }
};

prompt(string, options);
