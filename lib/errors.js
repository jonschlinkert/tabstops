'use strict';

module.exports = {
  MISSING_HANDLER: node => `No handlers are registered for "${node.type}"`,
  UNMATCHED_INPUT: input => `Unmatched input: "${input}"\n`
};
