'use strict';

console.time('total');
process.on('exit', () => console.timeEnd('total'));

const path = require('path');
const helpers = require('./support/helpers');
const colors = require('ansi-colors');
const Tabstops = require('..');

let pkg = `{
  "name": "#{1:#{name}}",
  "description": "#{2:#{description=This is a description}}",
  "version": "#{3:#{version=0.1.0}}",
  "homepage": "#{4:homepage}",
  "author": "#{5:author.name} (https://github.com/#{6:author.username})",
  "repository": "#{7:#{owner=#{6:author.username}}}/#{1:name}",
  "bugs": {
    "url": "https://github.com/#{7:#{owner=#{6:#{author.username=#{bar=#{baz}}}}}}/#{1:name}/issues"
  },
  "files": #{files:$TM_FILEPATH},
  "engines": {
    "node": ">=#{8:#{engine=10}}"
  },
  "license": "#{9:#{license=MIT}}",
  "scripts": {
    "test": "mocha"
  },
  "keywords": #{10:#{keywords}},
  "almost_a_template": "{{{$}}}"
}`;

const data = {
  // ...require('../package'),
  name: 'assemble',
  author: { name: 'Jon Schlinkert', username: 'jonschlinkert' },
  TM_FILEPATH: path.relative(process.cwd(), __filename),
  // owner: 'assemble',
  bar: 'XXX',
  baz: 'ZZZ',
  keywords: 'foo,bar,baz'
};

(async () => {
  let tabstops = new Tabstops(pkg, { helpers, debug: true });
  return tabstops.render(data).then(res => console.log(res));
})().catch(console.error);

