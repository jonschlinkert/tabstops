'use strict';

const Block = require('./Block');
const builtins = require('../helpers');
const { FORMAT_STRING_REGEX } = require('../constants');

class Transform extends Block {
  onClose(options) {
    this.params = this.parse(options);
    this.isTransform = true;
    super.onClose(options);
  }

  parse(options) {
    const keys = ['source', 'format', 'flags'];
    const nodes = this.nodes.slice(1, -1);
    const name = this.name || this.nodes[0].match[2];

    let params = { type: this.type, string: this.stringify(), varname: name };
    let type = keys.shift();

    while (nodes.length) {
      let node = nodes.shift();

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
      params.regex = new RegExp(params.source, params.flags);
      params.replacers = this.replacers(params.format, options);
    } catch (err) {
      params.invalid = true;
      return params;
    }

    return params;
  }

  replacers(format, options = {}) {
    const helpers = { ...builtins, ...options.helpers };
    return [].concat(format).map(str => {
      let match = FORMAT_STRING_REGEX.exec(str);
      if (!match) {
        if (str === '/') str = '';
        return { value: str };
      }

      let capture = match[1] || match[2] || '';
      let delim = match[3];
      let operator = match[4] || '';
      let rest = [match[5], match[6]];

      let helperName = '';
      let helper = '';
      let elseValue = '';
      let ifValue = '';

      if (delim) {
        switch (operator) {
          case '/':
            helperName = rest[0];
            helper = helpers[rest[0]] || (val => val);
            break;
          case '+':
            ifValue = rest[0];
            break;
          case '?':
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
        delim,
        helper,
        helperName,
        operator,
        ifValue,
        elseValue
      };
    });
  }

  transform(input) {
    let { replacers } = this.params;
    let value = input != null ? String(input) : '';
    let matched = false;

    if (this.params.invalid === true) {
      return this.params.string;
    }

    let result = value.replace(this.params.regex, (...args) => {
      let index = args[args.length - 2];
      args = args.slice(0, -2);
      matched = true;

      let output = '';

      for (let replacer of replacers) {
        if (replacer.value) {
          output += replacer.value;
          continue;
        }

        if (replacer.operator === '-') {
          output += args[0];
          continue;
        }

        let arg = args[replacer.index];

        if (replacer.operator === '+' && arg !== void 0) {
          output += replacer.ifValue;
          continue;
        }

        if (replacer.operator === '?') {
          if (arg !== void 0) {
            output += replacer.ifValue;
          } else {
            output += replacer.elseValue;
          }
          continue;
        }

        if (replacer.operator === '/' && arg !== void 0) {
          output += replacer.helper.call(this, arg, index, value, this) || '';
          continue;
        }

        if (replacer.operator !== '-' && typeof arg === 'string') {
          output += arg;
          continue;
        }
      }

      return output;
    });

    if (matched === false && replacers.length === 1 && replacers[0].elseValue) {
      return replacers[0].elseValue;
    }

    return result;
  }
}

module.exports = Transform;
