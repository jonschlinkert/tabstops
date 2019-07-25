'use strict';

require('mocha');
const assert = require('assert').strict;
const { parse, compile } = require('../lib/Parser');

const render = (input, data) => {
  const fn = compile(input);
  return fn(data);
};

describe('api - variables', () => {
  it('should expose variables from the context', () => {
    let data = { TM_LINE_NUMBER: 10, FILE_NAME: 'AbCdE.FgH', USERNAME: process.env.USER };
    assert.equal(render('${TM_LINE_NUMBER/(10)/${1:+It is}/} line 10', data), 'It is line 10');
    assert.equal(render('${TM_LINE_NUMBER/(10)/${1:?It is:It is not}/} line 10', data), 'It is line 10');
    assert.equal(render('${TM_LINE_NUMBER/(11)/${1:?It is:It is not}/} line 11', data), 'It is not line 11');
    assert.equal(render('${TM_LINE_NUMBER/(11)/${1:-It is not}/} line 11', data), 'It is not line 11');
    assert.equal(render('before ${USERNAME/^(.*?)$/${1:/upcase}/} after', data), 'before JONSCHLINKERT after');
    assert.equal(render('before ${FILE_NAME/^(.*?)\\.(.*?)$/${1:/upcase}${2:/downcase}/} after', data), 'before ABCDEfgh after');
    assert.equal(render('before ${USERNAME/^(.*?)$/${1}/} after', data), 'before jonschlinkert after');
    assert.equal(render('before ${USERNAME/^(.*?)$/$1/g} after', data), 'before jonschlinkert after');
  });
});
