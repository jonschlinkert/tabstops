'use strict';

const path = require('path');

const localize = (options = {}) => {
  let date = options.date ? new Date(options.date) : new Date();
  let locale = options.locale || 'en-US';
  return new Intl.DateTimeFormat(locale, options).format(date);
};

module.exports = (state = {}, options = {}) => {
  const variables = {
    TM_SELECTED_TEXT: (state.selected || ''),
    TM_CURRENT_LINE: (state.input || '').split('\n')[state.line] || '',
    TM_CURRENT_WORD: (state.input || ''),
    TM_LINE_INDEX: (state.line || 0),
    TM_LINE_NUMBER: (state.line || 0) + 1,
    TM_DIRECTORY: (options.file && options.file.dirname) || (options.file.path && path.dirname(options.file.path)) || options.cwd || process.cwd(),
    TM_PROJECT_DIRECTORY: options.cwd || (options.file.path && path.dirname(options.file.path)) || process.cwd(),
    TM_FILENAME: options.file && options.file.basename || (options.file.path && path.basename(options.file.path)),
    TM_FILEPATH: options.file && options.file.path,

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
      return localize({ weekday: 'long' });
    },
    get CURRENT_DAY_NAME_SHORT() {
      return localize({ weekday: 'short' });
    },
    get CURRENT_DAY_LETTER() {
      return localize({ weekday: 'narrow' });
    },

    get CURRENT_MONTH_NAME() {
      return localize({ month: 'long' });
    },
    get CURRENT_MONTH_NAME_SHORT() {
      return localize({ month: 'short' });
    },
    get CURRENT_MONTH_LETTER() {
      return localize({ month: 'narrow' });
    },
    get CURRENT_MONTH_NUMBER() {
      return localize({ month: 'numeric' });
    },

    get CLIPBOARD() {
      return require('clipboardy').readSync();
    }
  };

  for (let key of Object.keys(process.env)) {
    variables['ENV_' + key] = process.env[key];
  }

  return variables;
};
