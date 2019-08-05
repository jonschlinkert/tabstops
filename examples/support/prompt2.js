'use strict';

const Session = require('..');

// const session = new Session(string);
// const ast = session.parse();
// const range = ast.nodes[3].loc.lines;

// const slice = (lines, start, end) => {
//   return start === end ? lines[start] : lines.slice(start, end);
// };

// console.log(slice(session.lines, ...range));


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
    let item = session.focused;
    let type = item.type;

    if (type === 'checkbox' || type === 'radio') {
      if (event.name === 'up' || event.name === 'down') {
        event.shift = event.name === 'up';
        event.name = 'tab';
      }

      if (typeof item[event.name] === 'function') {
        item[event.name]();
      }
    }

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
