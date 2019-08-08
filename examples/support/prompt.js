'use strict';

const keypress = require('enquirer/lib/keypress');
const readline = require('readline');
const update = require('log-update');
const escapes = require('ansi-escapes');
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
    update.clear(1);

    if (options.onClose) {
      setImmediate(() => {
        options.onClose.call(session, colors.unstyle(result), session);
      });
    }
  };

  rl.write(escapes.cursorSavePosition);

  session.on('alert', () => {
    session.alert = false;
    rl.write('\u0007');
  });

  rl.on('SIGINT', close);
  rl.on('line', close);

  rl.input.on('keypress', (input, event) => {
    if (!session.focused) return;
    let action = keypress.action(input, event);
    let item = session.focused;
    let type = item.type;

    item.input = colors.unstyle(item.input || '');
    event.action = event.name;
    event.input = input;

    if (type === 'checkbox' || type === 'radio') {
      if (!item.group && (event.name === 'up' || event.name === 'down')) {
        event.shift = event.name === 'up';
        event.name = 'tab';
      }

      if (typeof item[event.name] === 'function') {
        item[event.name]();
      }
    }

    // if (typeof session[event.name] === 'function') {
    //   session[event.name](event);
    // }

    // if (/^[0-9]+$/.test(event.name)) {
    //   event.name = event.action = 'number';
    // }

    // if (event.name === 'y' && event.ctrl === true) {
    //   session.togglePlaceholders();
    //   // event.action = 'togglePlaceholders';
    // }

    if (event.code === '[5~') {
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
      session[event.shift === true ? 'shiftup' : 'up']();
    } else if (event.name === 'down') {
      session[event.shift === true ? 'shiftdown' : 'down']();
    } else if (item.readonly !== true) {
      // session.dispatch(input, event);
      if (event.name === 'backspace' || event.name === 'delete') {
        item.input = item.input.slice(0, -1);
      } else {
        item.input = item.input + input;
      }

      item.input = item.input.replace(/\r/g, '');
      item.input = item.input.replace(/\\?"/g, '\\"');
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
