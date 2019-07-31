'use strict';

const colors = require('ansi-colors');
const Session = require('..');
const string = [
  '{',
  // '  "name": "${1:name}",',
  // '  "file": "${TM_FILENAME/(\\/[^/]*?)$/$1/}",',
  // // '  "file": "${TM_FILENAME/(\\/[^/]*?)$/${1:/upcase}/i}",',
  // // '  "file": "${TM_FILENAME/.*\\/([^/]*?)$/${1:/upcase}/ig}",',
  // // '  "file": "${TM_FILENAME/(.*)/$1/g}",',
  // '  "description": "${2:${description:\'My amazing new project.\'}}",',
  // '  "version": "${3:${version:0.1.0}}",',
  // '  "repository": "${4:${owner}}/${name}",',
  // '  "choose": "${5|foo,bar,baz|}",',
  // '  "mirror": "${5}",',
  // '  "mirror2": "$5",',
  // '  "homepage": "https://github.com/${owner}/${name}",',
  // '  "author": "${fullname} (https://github.com/${username})",',
  // '  "bugs": {',
  // '    "url": "https://github.com/${owner}/${name}/issues"',
  // '  },',
  // '  "main": "index.js",',
  // '  "engines": {',
  // '    "node": ">=${engine:10}"',
  // '  },',
  // '  "license": "${license:MIT}",',
  // '  "scripts": {',
  // '    "test": "mocha"',
  // '  },',
  // '  "keywords": ${keywords}',
  // '  "helper": "${1/^(.*)$/${1:/helper}}"',
  '  "choices": ${1|${sllssl:${home}},$array,$user|}',
  '  "choices": ${2|$array,${sllssl:${home}},$user|}',
  '  "choices": ${3|${sllssl:${home}},${array},$user|}',
  // '  "choices": ${2|$array|}',
  // '  "choices": ${choices}',
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

const options = {
  visible: 7,
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
  helpers: {
    helper(key) {
      return process.env[key];
    }
  },
  data: {
    home: require('os').homedir(),
    user: process.env.USER,
    array() {
      return ['one', 'two', 'three'];
    },
    _name: 'Brian',
    TM_FILENAME: __filename,
    ENV_FILENAME: 'index.js'
  }
};

const string2 = '[${1|${files}|}](#${1/^(.*)$/${1:/slugify}})';
const fs = require('fs');

// prompt('${1|${file}|}', {
//   data: {
//     file() {
//       return fs.readdirSync(process.cwd());
//     }
//   }
// });

const survey = `
Add some numbers:
  \${1:\${numbers}} \${2:\${items|Foo,Bar,Baz|}}
  \${3|\$1|} \${2}
  \${4|\$1|} \${2}
  \${5|\$1|} \${2}

  Total: \${total/^(.*)$/\${1:/currency}}
`;

prompt(survey, {
  readonly: ['total', 'numbers', 1],
  invisible: [1],
  display: 'list',
  // invert: true,
  actions: {
    left() {
      if (!this.focused.choices) return;
      if (this.focused.cursor > 0) {
        this.focused.cursor--;
      }
    },
    right() {
      if (!this.focused.choices) return;
      if (this.focused.cursor < this.focused.choices.length - 1) {
        this.focused.cursor++;
      }
    },
    prev() {
      if (this.index > 0) {
        this.index--;
      }
    },
    next() {
      if (this.index < this.length - 1) {
        this.index++;
      }
    }
    // up() {
    //   return this.prev();
    // },
    // down() {
    //   return this.next();
    // }
  },
  helpers: {
    add(...args) {
      return args.reduce((a, e) => a + +e, 0);
    },
    currency(value) {
      return `$${Number(value).toFixed(2)}`;
    }
  },
  // init(session, rl) {
  //   rl.close();
  // },
  data: {
    total(...args) {
      let n = 0;
      for (let [k, v] of this.values.tabstop) {
        n += Number(v);
      }
      return String(n);
    },
    numbers() {
      return [0, 1, 2, 3, 4, 5];
    },
    file() {
      return fs.readdirSync(process.cwd());
    }
  }
});

// prompt(string2, {
//   helpers: {
//     slugify(value) {
//       return value.toLowerCase().replace(/\W/g, '');
//     }
//   },
//   data: {
//     files() {
//       return fs.readdirSync(process.cwd());
//     }
//   }
// });

// const session = new Session(string);
// const ast = session.parse();
// const range = ast.nodes[3].loc.lines;

// const slice = (lines, start, end) => {
//   return start === end ? lines[start] : lines.slice(start, end);
// };

// console.log(slice(session.lines, ...range));
