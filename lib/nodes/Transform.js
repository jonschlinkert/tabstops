'use strict';

const { REGEX_FORMAT_RE } = require('../constants');
const builtins = require('../helpers');
const Block = require('./Block');
// const REGEX_FORMAT_RE = /^(?:\$([0-9]+)|\${([0-9]+)(?:(:)?([-+?\/])?((?:\\[^\\]|.)+?)(?::((?:\\[^\\]|.)+?))?)?})(.*)$/;

class Transform extends Block {
  parse(options) {
    const keys = ['source', 'format', 'flags'];
    const nodes = this.nodes.slice(1, -1);

    let params = { outer: this.stringify(), varname: this.name };
    let type = keys.shift();

    while (nodes.length) {
      let node = nodes.shift();
      if (!node.match && !node.nodes) continue;

      if (node.value === '/' && nodes.length) {
        node = nodes.shift();
        params[(type = keys.shift())] = node.stringify();
        continue;
      }

      if (node.value === '/') {
        continue;
      }

      if (params[type]) {
        params[type] = [].concat(params[type]).concat(node.stringify());
      } else {
        params[type] = node.stringify();
      }
    }

    while (keys.length) {
      params[keys.shift()] = '';
    }

    if (params.flags && !/^[gimuy]+$/.test(params.flags)) {
      params.invalid = true;
      return params;
    }

    if (!params.source) {
      params.source = '$^';
      params.flags = '';
    }

    try {
      params.source = [].concat(params.source).join('');
      params.regexp = new RegExp(params.source, params.flags);
      params.replacers = this.replacers(params.format, options);
    } catch (err) {
      if (!(err instanceof SyntaxError)) {
        throw err;
      }
      params.invalid = true;
      return params;
    }

    return params;
  }

  replacers(format, options = {}) {
    const helpers = { ...builtins, ...options.helpers };

    return [].concat(format).map(str => {
      let match = REGEX_FORMAT_RE.exec(str);
      if (!match) {
        if (str === '/') str = '';
        return { value: str };
      }

      let capture = match[1] || match[2];
      let delim = match[3];
      let operator = match[4] || '';
      let rest = [match[5], match[6]];
      let append = match[7] || '';

      let helperName;
      let helper;
      let elseValue;
      let ifValue;

      if (delim) {
        switch (operator) {
          case '/':
            helperName = rest[0];
            helper = helpers[rest[0]];
            break;
          case '+':
            ifValue = rest[0];
            break;
          case '?':
            if (rest.length !== 2) return str;
            ifValue = rest[0];
            elseValue = rest[1];
            break;
          case '-':
          case '':
          default: {
            elseValue = rest[0];
            break;
          }
        }
      }

      return {
        index: Number(capture),
        helper,
        helperName,
        operator,
        ifValue,
        elseValue,
        append
      };
    });
  }

  transform(options, value, tabstops) {
    let matched = false;
    let output = '';

    // if (!this.params) return this.stringify();
    if (this.params.invalid === true) {
      return this.params.outer;
    }

    value.replace(this.params.regexp, (...args) => {
      args = args.slice(0, -2);
      matched = true;

      for (let replacer of this.params.replacers) {
        if (replacer.value) {
          output += replacer.value;
          continue;
        }

        if (replacer.operator === '+' && args[replacer.index] !== void 0) {
          output += replacer.ifValue;
          continue;
        }

        if (replacer.operator === '?') {
          if (args[replacer.index] !== void 0) {
            output += replacer.ifValue;
          } else {
            output += replacer.elseValue;
          }
          continue;
        }

        if (replacer.operator === '/' && args[replacer.index] !== void 0) {
          output += replacer.helper(args[replacer.index]) || '';
          continue;
        }

        if (args[replacer.index] !== void 0) {
          output += args[replacer.index];
          continue;
        }
      }
    });

    if (matched === false) {
      return '';
    }

    return output;
  }
}

module.exports = Transform;
