'use strict';

const colors = require('ansi-colors');
const debug = (...args) => {
  if (process.env.DEBUG_SNIPPETS === '1') {
    console.error(...args);
  }
};

module.exports = {
  choices(state) {
    debug(`<Choices: <${state.resolved}: "${state.value}">`);
    return colors.yellow.bold(`<${state.value.join('/')}>`);
  },

  placeholder(state) {
    debug(`<Placeholder: <${state.resolved}: "${state.value}">`);
    return colors.blue(`<${state.value}>`);
  },

  placeholder_transform(state) {
    debug(`<PlaceholderTransform: <${state.resolved}: "${state.value}">`);
    return colors.green(`<${state.value}>`);
  },

  tabstop(state) {
    debug(`<Tabstop: <${state.resolved}: "${state.value}">`);
    return colors.red(`<${state.value}>`);
  },

  variable(state) {
    debug(`<Variable: <${state.resolved}: "${state.value}">`);
    return colors.yellow(`<${state.value}>`);
  },

  variable_transform(state) {
    debug(`<VariableTransform: <${state.resolved}: "${state.value}">`);
    return colors.cyan(`<${state.value}>`);
  }
};

