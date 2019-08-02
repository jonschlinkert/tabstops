'use strict';

exports.files_helper = `
Pick some files:
  \${1|\${files}|}
  \${2|$1|}
  \${3|$1|}
  \${4|$1|}
`;

exports.files_transform = '[${1|${files}|}](#${1/^(.*)$/${1:/slugify}})';

exports.numbers_helper = `
Pick some numbers:
  \${1:\${numbers}}
  \${2|$1|}
  \${3|$1|}
  \${4|$1|}

  Total: \${total/^(.*)$/\${1:/currency}}
`;

exports.numbers_helper2 = `
Add some numbers:
  \${1:\${numbers}} \${2:\${items|Foo,Bar,Baz|}}
  \${3|$1|} \${2}
  \${4|$1|} \${2}
  \${5|$1|} \${2}

  Total: \${total/^(.*)$/\${1:/currency}}
`;
