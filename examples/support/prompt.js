'use strict';

const readline = require('readline');
const update = require('log-update');
const colors = require('ansi-colors');
const Session = require('../..');

const prompt = (input, options = {}) => {
  const { stdin, stdout } = process;
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const session = new Session(input, { ...options, decorate: true });

  readline.emitKeypressEvents(rl.input);
  if (stdin.isTTY) stdin.setRawMode(true);

  const close = () => {
    rl.close();
    let result = session.renderResult();
    update.clear();

    if (options.onClose) {
      options.onClose(result, session);
    }
    process.exit();
  };

  session.on('alert', () => {
    session.alert = false;
    rl.write('\u0007');
  });

  rl.on('SIGINT', close);
  rl.on('line', close);
  rl.input.on('keypress', (input, event) => {
    if (event.name === 'y' && event.ctrl === true) {
      session.togglePlaceholders();
    } else if (event.code === '[5~') {
      session.pageup();
    } else if (event.code === '[6~') {
      session.pagedown();
    } else if (event.name === 'space' && session.focused.type === 'checkbox') {
      session.focused.toggle();
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
  if (options.init) {
    options.init(session, rl);
  }
};

module.exports = prompt;
