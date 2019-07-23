'use strict';

const identity = value => value;
const { INSERTIONS_RE, REGEX_FORMAT_RE } = require('../constants');
const formatters = require('../formatters');
const builtins = require('../helpers');
const Node = require('./Node');

class Transform extends Node {
  constructor(node = {}) {
    super(node);
    this.nodes = node.nodes || [];

    if (node.match && node.match.type) {
      this.type = node.match.type;
    }
  }

  inner(join = true) {
    let value = this.match[0].slice(2, -1);
    let parts = this.nodes.slice(1, -1).map(node => node.stringify());
    let inner = [value, '/', ...parts];
    if (join) {
      return inner.join('');
    }
    return inner;
  }

  /**
   * The initial state object to be used by the compile method
   * when resolving values.
   * @param {Object} `context``
   * @param {Object} `options`
   * @return {Object}
   */

  initialState(context = {}, options = {}) {
    return { node: this, resolved: 'value', value: this.value, varname: this.value };
  }

  parse(options) {
    const keys = ['varname', 'source', 'format', 'flags'];
    const parts = this.inner(false);

    let segments = parts.slice();
    let type = keys.shift();
    let params = {};

    while (segments.length) {
      let segment = segments.shift();

      if (segment === '/') {
        params[(type = keys.shift())] = segments.shift();
        continue;
      }

      if (params[type]) {
        params[type] = [].concat(params[type]).concat(segment);
      } else {
        params[type] = segment;
      }
    }

    while (keys.length) {
      params[keys.shift()] = '';
    }

    params.regexp = new RegExp(params.source, params.flags);
    params.replacers = this.replacers(params.format, options);

    params.replace = input => {
      let str = `${input}`;

      for (let replacer of params.replacers) {
        let i = 0;

        str = str.replace(params.regexp, (...args) => {
          return this.replacer(replacer, ...args);
        });

        // console.log([params.regexp.global]);

        let hasElse = ['-', '?'].includes(replacer.operator);
        if (i === 0 && hasElse && replacer.elseValue) {
          str = replacer.elseValue + replacer.append;
        }
      }
      return str;
    };

    return params;
  }

  replacers(format, options = {}) {
    const helpers = { ...builtins, ...options.helpers };

    return [].concat(format).map(str => {
      let match = REGEX_FORMAT_RE.exec(str);
      if (!match) return str;

      let tabstop = match[1] || match[2];
      let sep = match[3];
      let operator = match[4];
      let rest = [match[5], match[6]];
      let append = match[7] || '';
      let helper, ifValue = '', elseValue = '';

      if (sep) {
        if (operator === '/') {
          helper = rest[0];
        } else if (operator === '?') {
          if (rest.length !== 2) return str;
          ifValue = rest[0];
          elseValue = rest[1];
        } else if (operator === '+') {
          ifValue = rest[0];
        } else if (operator === '-' || !operator) {
          elseValue = rest[0];
        }
      }

      return {
        index: Number(tabstop),
        helper: helpers[helper] || identity,
        operator,
        ifValue,
        elseValue,
        append
      };
    });
  }

  replacer(replacer, ...args) {
    let rest = args.slice(0, -2);
    let output = '';

    if (!replacer) {
      return output;
    }

    if (typeof replacer === 'string') {
      return replacer;
    }

    let { match, helper, index, operator, append, ifValue, elseValue } = replacer;

    if (rest[index] !== void 0) {
      let value = helper(rest[index], this);
      if (value !== void 0 && ifValue)  {
        value = ifValue;
      }

      output += value || elseValue;
      output += append;
    }

    return output;
  }

  replace(value, options) {
    let { replace } = this.parse(options);
    return replace(value);
  }

  insertion() {


  }

  resolve(str) {
    let helper = helpers[this.shorthandName];
    if (helper) {
      return helper(str);
    }

    if (Boolean(str) && typeof this.ifValue === 'string') {
      return this.ifValue;
    }

    if (!Boolean(str) && typeof this.elseValue === 'string') {
      return this.elseValue;
    }

    return str || '';
  }

  toTextmateString() {
    let value = `\${${this.index}`;

    if (this.shorthandName) {
      value += `:/${this.shorthandName}`;
    } else if (this.ifValue && this.elseValue) {
      value += `:?${this.ifValue}:${this.elseValue}`;
    } else if (this.ifValue) {
      value += `:+${this.ifValue}`;
    } else if (this.elseValue) {
      value += `:-${this.elseValue}`;
    }

    return `${value}}`;
  }

  compile(options) {
    let opts = { formatters, ...options };
    let format = opts.formatters[this.type] || opts.formatters.identity;

    return (context = {}) => {
      const state = this.initialState(context, options);

      if (!this.isValue(state.value)) {
        return format(state);
      }

      state.resolved = 'inner';
      state.params = this.parse(options);
      state.value = state.params.replace(state.value);
      return format(state);
    };
  }
}

module.exports = Transform;

