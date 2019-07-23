'use strict';

const Node = require('../Node');

const block = new Node({ type: 'brace', nodes: [] });
block.push(new Node({ type: 'open', value: '${' }));
block.push(new Node({ type: 'text', value: 'first' }));
block.push(new Node({ type: 'colon', value: ':' }));
block.push(new Node({ type: 'text', value: 'last' }));
block.push(new Node({ type: 'close', value: '}' }));

console.log(block);
