'use strict';

const colors = require('ansi-colors');
const env = process.env;
const log = (...args) => {
  if (process.env.DEBUG_SNIPPETS === 'true') {
    console.error(...args);
  }
};

const formatters = {
  identity: state => state.value,
  choices: state => state.value,
  placeholder: state => state.value,
  placeholder_transform: state => state.value,
  tabstop: state => state.value,
  variable: state => state.value,
  variable_transform: state => state.value,
  text: state => state.value
};

const debug = {
  identity: state => state.value,

  choices(state) {
    log(`<Choices: <${state.resolved}: "${state.value}">`);
    return colors.yellow.bold(`<${state.value.join('/')}>`);
  },

  placeholder(state) {
    log(`<Placeholder: <${state.resolved}: "${state.value}">`);
    return colors.blue(`<${state.value}>`);
  },

  placeholder_transform(state) {
    log(`<PlaceholderTransform: <${state.resolved}: "${state.value}">`);
    return colors.green(`<${state.value}>`);
  },

  tabstop(state) {
    log(`<Tabstop: <${state.resolved}: "${state.value}">`);
    return colors.red(`<${state.value}>`);
  },

  variable(state) {
    log(`<Variable: <${state.resolved}: "${state.value}">`);
    return colors.yellow(`<${state.value}>`);
  },

  variable_transform(state) {
    log(`<VariableTransform: <${state.resolved}: "${state.value}">`);
    return colors.cyan(`<${state.value}>`);
  }
};

formatters.debug = debug;
module.exports = formatters;
