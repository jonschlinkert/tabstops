'use strict';

const path = require('path');

const parseFile = (filename, options = {}) => {
  let cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
  let filepath = path.resolve(cwd, filename);
  let file = path.parse(filepath);
  let relative = path.relative(cwd, filepath);

  return {
    cwd,
    path: filepath,
    dirname: file.dir,
    stem: file.name,
    basename: file.base,
    relative,
    relativeDir: path.dirname(relative)
  };
};

const localize = (variableOptions = {}, options) => {
  let opts = { locale: 'en-US', ...options, ...variableOptions };
  let date = opts.date ? new Date(opts.date) : new Date();
  delete opts.locale;
  delete opts.date;
  return new Intl.DateTimeFormat(opts.locale, opts).format(date);
};

module.exports = (data = {}, options = {}) => {
  const file = { ...parseFile(__filename), ...options.file };
  const context = { input: '', selection: '', word: '', line: 0, index: 0, ...data };

  const variables = {
    TM_SELECTED_TEXT: context.selection,
    TM_CURRENT_LINE: context.input.split('\n')[context.line + 1] || '',
    TM_CURRENT_WORD: context.word,
    TM_LINE_INDEX: context.index,
    TM_LINE_NUMBER: context.line + 1,
    TM_DIRECTORY: file.dirname,
    TM_PROJECT_DIRECTORY: file.cwd,
    TM_FILENAME: file.basename,
    TM_FILEPATH: file.path,

    FILE_PATH: file.path,
    FILE_NAME: file.basename,
    FILE_BASENAME: file.basename,
    FILE_DIRNAME: file.dirname,
    FILE_STEM: file.stem,
    FILE_EXTNAME: file.extname,
    FILE_RELATIVE_PATH: file.relative,
    FILE_RELATIVE_DIRECTORY: file.relativeDir,

    get TM_FULLNAME() {
      return data.fullname || '';
    },
    get TM_USERNAME() {
      return data.username || process.env.USER;
    },

    /**
     * Dates
     */

    get CURRENT_YEAR() {
      return String(new Date().getFullYear());
    },
    get CURRENT_YEAR_SHORT() {
      return String(new Date().getFullYear()).slice(-2);
    },
    get CURRENT_MONTH() {
      return String(new Date().getMonth().valueOf() + 1).padStart(2, '0');
    },
    get CURRENT_DATE() {
      return String(new Date().getDate().valueOf()).padStart(2, '0');
    },
    get CURRENT_HOUR() {
      return String(new Date().getHours().valueOf()).padStart(2, '0');
    },
    get CURRENT_MINUTE() {
      return String(new Date().getMinutes().valueOf()).padStart(2, '0');
    },
    get CURRENT_SECOND() {
      return String(new Date().getSeconds().valueOf()).padStart(2, '0');
    },

    get CURRENT_DAY_NAME() {
      return localize({ weekday: 'long' }, options);
    },
    get CURRENT_DAY_NAME_SHORT() {
      return localize({ weekday: 'short' }, options);
    },
    get CURRENT_DAY_LETTER() {
      return localize({ weekday: 'narrow' }, options);
    },

    get CURRENT_MONTH_NAME() {
      return localize({ month: 'long' }, options);
    },
    get CURRENT_MONTH_NAME_SHORT() {
      return localize({ month: 'short' }, options);
    },
    get CURRENT_MONTH_LETTER() {
      return localize({ month: 'narrow' }, options);
    },
    get CURRENT_MONTH_NUMBER() {
      return localize({ month: 'numeric' }, options);
    },

    get CLIPBOARD() {
      if (typeof context.clipboard === 'string') {
        return context.clipboard;
      }
      if (typeof options.clipboard === 'function') {
        return options.clipboard();
      }
      return '';
    }
  };

  for (let key of Object.keys(process.env)) {
    if (key[0] !== '_') {
      variables[`ENV_${key.replace(/^ENV_/, '')}`] = process.env[key];
    }
  }

  return variables;
};
