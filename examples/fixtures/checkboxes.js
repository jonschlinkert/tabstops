

exports.group_concept = `
Favorite fruits?

  #{choices}
  \${[x]:Apple}
  \${[ ]:Banana}
  \${[x]:Strawberry}
  \${[-]:Watermelon:Pick this one}
  #{/choices}
`;
