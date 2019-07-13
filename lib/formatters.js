
module.exports = {
  tabstop(state) {
    console.log(`<Tabstop: <${state.resolved}: "${state.value}">`);
    return `<${state.value}>`;
  },

  placeholder(state) {
    console.log(`<Placeholder: <${state.resolved}: "${state.value}">`);
    return `<${state.value}>`;
  },

  tabstop_transform(state) {
    console.log(`<TabstopTransform: <${state.resolved}: "${state.value}">`);
    return `<${state.value}>`;
  },

  variable(state) {
    console.log(`<Variable: <${state.resolved}: "${state.value}">`);
    return `<${state.value}>`;
  },

  variable_transform(state) {
    console.log(`<VariableTransform: <${state.resolved}: "${state.value}">`);
    return `<${state.value}>`;
  }
};
