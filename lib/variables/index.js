'use strict';

const os = require('os');
const path = require('path');
const localize = require('./localize');
const parseFile = require('./parse-file');
const { execSync } = require('child_process');

module.exports = (options = {}) => {
  const data = options.data || {};
  const file = parseFile(options.file || __filename, options);

  const variables = {
    env: process.env,

    /**
     * "file" variable
     */
    file,

    /**
     * TextMate Editor Variables
     */
    TM_SELECTION() {
      return data.selection;
    },
    TM_SELECTED_TEXT() {
      return data.selection;
    },
    TM_CURRENT_LINE() {
      return data.line;
    },
    TM_CURRENT_WORD() {
      return data.word;
    },
    TM_LINE_INDEX() {
      return data.lineIndex;
    },
    TM_LINE_NUMBER() {
      if (typeof data.lineIndex === 'number') {
        return data.lineIndex + 1;
      }
      return data.lineNumber;
    },

    /**
     * TextMate File Variables
     */
    TM_DIRECTORY() {
      return file.dirname;
    },
    TM_PROJECT_DIRECTORY() {
      return file.cwd;
    },
    TM_PROJECT_FOLDER() {
      return path.basename(file.cwd);
    },
    TM_FILENAME() {
      return file.basename;
    },
    TM_FILEPATH() {
      return file.path;
    },
    TM_FOLDER() {
      return file.folder;
    },

    /**
     * File variables
     */
    TM_FILEPATH() {
      return file.path;
    },
    TM_FILENAME() {
      return file.basename;
    },
    FILE_BASENAME() {
      return file.basename;
    },
    FILE_DIRNAME() {
      return file.dirname;
    },
    FILE_STEM() {
      return file.stem;
    },
    FILE_EXTNAME() {
      return file.extname;
    },
    FILE_RELATIVE_PATH() {
      return file.relative;
    },
    FILE_RELATIVE_DIR() {
      return path.dirname(file.relative);
    },

    TM_FULLNAME() {
      if (typeof data.fullname === 'function') {
        return data.fullname();
      }
      return data.fullname || process.env.FULLNAME;
    },
    TM_USERNAME() {
      if (typeof data.username === 'function') {
        return data.username();
      }

      if (data.username) {
        return data.username;
      }

      let keys = ['LOGNAME', 'USER', 'USERNAME', 'SUDO_USER', 'C9_USER', 'LNAME'];
      for (let key of keys) {
        let value = process.env[key];
        if (value) {
          return value;
        }
      }

      return (os.userInfo && os.userInfo().username);
    },

    /**
     * User variables
     */
    FULLNAME() {
      return variables.TM_FULLNAME();
    },
    USERNAME() {
      return variables.TM_USERNAME();
    },

    /**
     * Date variables
     */
    CURRENT_YEAR() {
      return String(new Date().getFullYear());
    },
    CURRENT_YEAR_SHORT() {
      return String(new Date().getFullYear()).slice(-2);
    },
    CURRENT_MONTH() {
      return String(new Date().getMonth().valueOf() + 1).padStart(2, '0');
    },
    CURRENT_DATE() {
      return String(new Date().getDate().valueOf()).padStart(2, '0');
    },
    CURRENT_HOUR() {
      return String(new Date().getHours().valueOf()).padStart(2, '0');
    },
    CURRENT_MINUTE() {
      return String(new Date().getMinutes().valueOf()).padStart(2, '0');
    },
    CURRENT_SECOND() {
      return String(new Date().getSeconds().valueOf()).padStart(2, '0');
    },

    /**
     * Day variables
     */
    CURRENT_DAY_NAME() {
      return localize({ weekday: 'long' }, options);
    },
    CURRENT_DAY_NAME_SHORT() {
      return localize({ weekday: 'short' }, options);
    },
    CURRENT_DAY_LETTER() {
      return localize({ weekday: 'narrow' }, options);
    },

    /**
     * Month variables
     */
    CURRENT_MONTH_NAME() {
      return localize({ month: 'long' }, options);
    },
    CURRENT_MONTH_NAME_SHORT() {
      return localize({ month: 'short' }, options);
    },
    CURRENT_MONTH_LETTER() {
      return localize({ month: 'narrow' }, options);
    },
    CURRENT_MONTH_NUMBER() {
      return localize({ month: 'numeric' }, options);
    },

    /**
     * Clipboard
     */
    CLIPBOARD() {
      let clipboard = data.clipboard || options.clipboard;
      if (typeof clipboard === 'string') {
        return clipboard;
      }
      if (typeof clipboard === 'function') {
        return clipboard();
      }
      if (process.platform === 'darwin') {
        return execSync('pbpaste', options).toString();
      }
      return '';
    }
  };

  for (let key of Object.keys(data)) {
    variables[key] = data[key];
  }

  return variables;
};
