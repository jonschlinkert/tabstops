'use strict';

const define = (obj, key, value) => {
  Reflect.defineProperty(obj, key, { value });
};

const parse = (input, options = {}) => {
  const ast = { type: 'root', nodes: [] };
  const stack = [ast];
  const stash = [];
  let i = 0;

  let block, close, last, node, value;
  let peek = () => input[i + 1];
  let next = () => input[++i];
  let push = (node, parent = block) => {
    define(node, 'parent', parent);

    if (last && last.type === 'text' && node.type === 'text') {
      last.value += node.value;
    } else {
      parent.nodes.push(node);
    }
  };

  for (; i < input.length; i++) {
    value = input[i];
    block = stack[stack.length - 1];
    last = block.nodes ? block.nodes[block.nodes.length - 1] : block;

    switch (value) {
      case '\\':
        value += next();
        push({ type: 'text', value });
        break;

      case '$':
        if (block.type === 'tabstop' && block.sections) {
          push({ type: 'text', value });
          break;
        }

        if (peek() === '{') {
          close = val => val === '}';
          value += next();
        } else if (/[\w_]/.test(peek())) {
          close = val => /^[\S\w][\s\W]/.test(input.slice(i));
        }

        if (close) {
          node = { type: 'tabstop', stop: null, placeholder: '', nodes: [], close };
          let rest = input.slice(i + 1);

          if (isVariableName(rest)) {
            i = input.length;
            node.placeholder = rest;
            push(node);
            break;
          }

          if (isNumber(rest)) {
            i = input.length;
            node.stop = Number(rest);
            push(node);
            break;
          }

          close = null;
          push(node);
          push({ type: 'open', value }, node);
          stack.push(node);
          break;
        }

        push({ type: 'text', value });
        break;

      case '{':
        node = { type: 'brace', nodes: [] };
        push(node);
        push({ type: 'open', value }, node);
        stack.push(node);
        break;

      default: {
        if (block.type === 'choices') {
          switch (value) {
            case ',':
              block.choices.push(block.nodes.pop().value);
              break;
            case '|':
              next();
              block.type = 'tabstop';
              block.nodes.shift();
              stack.pop();
              while (block.nodes.length) {
                block.choices.push(block.nodes.pop().value);
              }
              delete block.close;
              break;
            default: {
              push({ type: 'text', value });
              break;
            }
          }
          break;
        }

        if (last && value === '|' && block.type === 'tabstop' && block.nodes.length === 2 && isValidVariable(last.value)) {
          last = block.nodes.pop();
          let isNum = isNumber(last.value);
          block.type = 'choices';
          block.stop = isNum ? Number(last.value) : null;
          block.varname = isNum ? '' : last.value;
          block.default = '';
          block.choices = [];
          break;
        }

        if (block.type === 'brace' && value === '}') {
          block = stack.pop();
          push({ type: 'close', value });
          break;
        }

        if (block.type === 'tabstop' && value === '/') {
          block.sections = block.sections || [];
          block.sections.push(value);
        }

        if (block.close && block.close(value) === true) {
          block = stack.pop();
          let first = block.nodes[0];

          if (value === '}') {
            push({ type: 'close', value });
          } else {
            if (last.value === '$' && isNumber(value)) {
              block.stop = Number(value);
            } else {
              last.value += value;

              if (last.type === 'text' && block.nodes.length === 2 && first.type === 'open' && !block.placeholder) {
                block.placeholder = last.value;
                block.nodes = [];
              }
            }
          }

          delete block.close;

          if (block.sections) {
            transformVariable(block, options);
            delete block.sections;
          }

          let text = block.nodes.find(node => node.type === 'text');
          if (text) {
            let match = /^([0-9]+)(?::(?!\/)([\s\S]*)$|$)/.exec(text.value);
            if (match) {
              block.stop = Number(match[1]);
              text.value = match[2] || '';
            }

            if (block.nodes.length === 3 && block.nodes[1] === text) {
              block.placeholder = text.value;
              block.nodes = [];
            }
          }

          block.nodes = block.nodes.filter(node => {
            if (node.type === 'text' && node.value === '') {
              return false;
            }
            if (options.collate === true) {
              if (node.type === 'open') {
                block.open = node.value;
                return false;
              }
              if (node.type === 'close') {
                block.close = node.value;
                return false;
              }
            }
            return true;
          });

          break;
        }

        if (stash.length) {
          value = stash.shift() + value;
        }

        push({ type: 'text', value });
        break;
      }
    }
  }

  // console.log(ast);
  return ast;
};

function transformVariable(block, options = {}) {
  if (block.sections.length < 2) return;

  block.type = 'transform_variable';
  let open = block.nodes.shift();
  let close = block.nodes.pop();
  block.transform = parse.stringify({ nodes: block.nodes });
  block.nodes = [open, ...parse.transform(block), close];
  delete block.placeholder;
  delete block.stop;

  if (options.collate === true) {
    for (let ele of block.nodes) block[ele.type] = ele.value;
    block.regex = new RegExp(block.regex, block.flags);
    block.nodes = [];

    let ast = parse(block.format, options);

    block.groups = ast.nodes.map(node => {
      if (node.type !== 'text') {
        node = { type: 'match', group: node.stop, value: node.placeholder };
      }
      return node;
    });

    block.replace = parse.replace(block);

    block.transform = (locals = {}) => {
      let value = locals[block.varname] || block.replace();

      if (value === '' || value == null) {
        return block.placeholder || '';
      }

      // block.regex.lastIndex = 0;
      // let result = value.replace(block.regex, block.format);

      if (typeof block.resolve === 'function') {
        return block.resolve(value, locals);
      }
      return value;
    };
  }
}

parse.replace = node => {
  node.value = '';
  return () => {
    node.varname.replace(node.regex, (...args) => {
      let groups = args.slice(0, -2);
      for (let ele of node.groups) {
        if (ele.type === 'text') {
          node.value += ele.value;
        } else {
          node.value += groups[ele.group] || '';
        }
      }
    });
    return node.value;
  };
};

// parse.conditional = (str, helpers = {}) => {
//   let segs = str.split(':');
//   let lt = segs[0];
//   let rt = segs[1];
//   let aft = segs[2];
//   let node = {};
//   console.log(segs)
//   if (isNumber(lt)) {
//     node.format = `$${lt}`;
//     // console.log(rt)

//     if (helpers[rt]) {
//       // ${1:/upcase}
//       node.resolve = helpers[rt];

//     } else if (rt[0] === '+') {
//       // ${1:+<if>}
//       node.resolve = value => {
//         return value ? rt.slice(1) : '';
//       };

//     } else if (rt[0] === '-') {
//       // ${2:-<else>}

//     } else if (rt[0] === '?') {
//       // ${2:?<if>:<else>}

//     } else {
//       node.resolve = (value, locals) => {
//         if (typeof locals[rt] === 'function') {
//           return locals[rt](value);
//         }
//         return value;
//       };
//     }
//   }
//   return node;
// };

parse.transform = block => {
  const input = block.transform;
  const tokens = [];
  let last, value;
  let i = 0;
  let next = () => input[++i];

  let sections = ['varname', 'regex', 'format', 'flags', 'placeholder'];
  let type = sections.shift();

  let push = token => {
    if (last && last.type === type && token.type === type) {
      last.value += token.value;
    } else {
      define(token, 'parent', block);
      tokens.push(token);
    }
  };

  for (; i < input.length; i++) {
    value = input[i];
    last = tokens[tokens.length - 1];

    if (type === 'flags' && !/[gmiy]/.test(value)) {
      if (!tokens.some(tok => tok.type === 'flags')) {
        tokens.push({ type: 'flags', value: '' });
      }
      type = sections.shift();
    }

    switch (value) {
      case '\\':
        value += next();
        push({ type, value });
        break;
      case '/':
        type = sections.shift();
        push({ type, value: '' });
        break;
      default: {
        if (type === 'placeholder' && value === ':') {
          value = '';
        }
        push({ type, value });
        break;
      }
    }
  }

  return tokens;
};

parse.stringify = ast => {
  let source = '';

  for (let node of ast.nodes) {
    if (node.value) {
      source += node.value;
    } if (node.open || node.close) {
      source += (node.open || node.close);
    } else if (node.placeholder) {
      source += node.placeholder;
    } else if (node.transform) {
      source += node.nodes[0].value + node.transform + node.nodes[node.nodes.length - 1].value;
    } else if (node.nodes) {
      source += parse.stringify(node);
    }
  }

  return source;
};

function isValidVariable(value) {
  return /^([0-9]+$|[a-z][_\w]+$)/i.test(value);
}

function isVariableName(value) {
  return /^[_a-zA-Z][_a-zA-Z0-9]*$/i.test(value);
}

function isNumber(value) {
  if (typeof value === 'number') {
    return value - value === 0;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return Number.isFinite ? Number.isFinite(+value) : isFinite(+value);
  }
  return false;
}

module.exports = parse;
