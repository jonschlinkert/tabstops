'use strict';

console.time('total');
process.on('exit', () => console.timeEnd('total'));

const path = require('path');
const compile = require('../lib/compile');
const parse = require('../lib/parse');

let rcc = `
<snippet>
  <content><![CDATA[
import React, { Component } from 'react';

export class \${1:\${TM_FILENAME/(.+)\\..+|.*/$1/:ComponentName}} extends Component {
  render() {
    return \${2:(
      \${3:<div>\${0}</div>}
    );}
  }
}

]]></content>
  <tabTrigger>rcc</tabTrigger>
  <scope>source.js -(meta)</scope>
  <description>React: class component</description>
</snippet>
`;

console.log(parse(rcc));
let fn = compile(rcc);
let res = fn({ TM_FILENAME: path.relative(process.cwd(), __filename) });
console.log(res);
