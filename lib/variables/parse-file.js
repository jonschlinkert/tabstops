'use strict';

const path = require('path');

const parseFile = (filename, data = {}) => {
  let cwd = data.cwd ? path.resolve(data.cwd) : process.cwd();
  let filepath = path.resolve(cwd, filename);
  let relative = path.relative(cwd, filepath);
  let file = path.parse(filepath);

  return {
    ...file,
    cwd,
    path: filepath,
    relative,
    dirname: file.dir,
    folder: path.basename(file.dir),
    name: file.base,
    basename: file.base,
    stem: file.name,
    extname: file.ext
  };
};

module.exports = parseFile;
