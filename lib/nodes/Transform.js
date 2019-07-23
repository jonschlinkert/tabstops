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
    // params.replacers = this.replacers(params.format, options);

    console.log(params)

    // const replacer = (...args) => {
    //   params.replacers.forEach(r => (r.seen = void 0));

    //   for (let i = 0; i < args.length; i++) {
    //     let repl = params.replacers.find(r => r.index === i);

    //     if (!repl) continue;
    //     if (typeof repl === 'string') {
    //       throw Error('Expected replacer to be an object');
    //     }

    //     repl.seen = true;
    //     args[i] = this.resolve(args[i], repl);
    //   }

    //   return args.slice(1).filter(v => v !== void 0).join('');
    // }

    // params.replace = value => {
    //   let regexp = params.regexp;
    //   let flags = (regexp.flags || '').replace('g', '');
    //   let regex = new RegExp(regexp.source || regexp, flags);
    //   let input = `${value}`;
    //   let before = input;
    //   let index = 0;
    //   let match;

    //   while ((match = regex.exec(input.slice(index)))) {
    //     let value = replacer(...match);

    //     index += match.index;
    //     input = input.slice(0, index) + value + input.slice(index + match[0].length);
    //     index += match[0].length;

    //     if (flags === regex.flags) {
    //       break;
    //     }
    //   }

    //   for (let replacer of params.replacers) {
    //     console.log(replacer)
    //     if (!replacer.seen) {
    //       let { operator, elseValue } = replacer;
    //       let hasElse = ['-', '?'].includes(operator);
    //       if (hasElse && elseValue) {
    //         input = elseValue;
    //       } else if (operator === '/' && replacer.helper && before === input) {
    //         input = '';
    //       }
    //     }

    //     delete replacer.seen;
    //   }

    //   return input;
    // };

    return params;
  }

  resolve(value, replacer) {
    if (replacer.helper) {
      return replacer.helper(value);
    }

    if (!!value && typeof replacer.ifValue === 'string') {
      return replacer.ifValue;
    }

    if (!value && typeof replacer.elseValue === 'string') {
      return replacer.elseValue;
    }

    if (['-', '?'].includes(replacer.operator)) {
      return '';
    }

    // let hasElse = ['-', '?'].includes(operator);
    // if (i === 0 && hasElse && elseValue) {
    //   str = elseValue;
    // }

    // args[i] = helper(args[i], this);

    // if (value !== void 0 && ifValue)  {
    //   value = ifValue;
    // }

    // output += value || elseValue;
    // output += append;
    // console.log(replacer)
    return value || '';
  }

  replacers(format, options = {}) {
    const helpers = { ...builtins, ...options.helpers };

    return [].concat(format).map(str => {
      let match = REGEX_FORMAT_RE.exec(str);
      if (!match) return { value: str };

      let capture = match[1] || match[2];
      let delim = match[3];
      let operator = match[4];
      let rest = [match[5], match[6]];
      let append = match[7] || '';
      let helper, ifValue, elseValue;

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
          case '+':
          case '':
          default: {
            elseValue = rest[0];
            break;
          }
        }
      }

      return {
        index: Number(capture),
        helper: helpers[helper],
        helperName: helper,
        operator,
        ifValue,
        elseValue,
        append
      };
    });
  }

  replacer(replacer, ...args) {
    let output = '';

    if (!replacer) {
      return output;
    }

    if (typeof replacer === 'string') {
      return replacer;
    }

    let { match, helper, index, operator, append, ifValue, elseValue } = replacer;

    if (args[index] !== void 0) {
      let value = helper(args[index], this);

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
      // state.params = this.parse(options);
      // state.value = state.params.replace(state.value);
      return format(state);
    };
  }
}

module.exports = Transform;

