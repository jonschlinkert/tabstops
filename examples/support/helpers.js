
module.exports = {
  files(value) {
    return value ? `["${value.split(/,\s*/).join('", "')}"]` : '[]';
  },
  keywords(value) {
    return value ? `["${value.split(/,\s*/).join('", "')}"]` : '[]';
  },
  author_email(value, node) {
    return value && value !== node.placeholder ? ` <${value}> ` : ' ';
  }
};
