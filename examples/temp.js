
// const parse = require('./parse');
// const render = (str, locals) => {
//   return compile(parse(str, { collate: true }), locals);
// };

// const ast = parse('FOO\n${1:$HOME\n${HOME/./=/g}}\nBAR', { collate: true });
// // const ast = parse('FOO\n${1:$HOME\n${HOME/(.)/${1:up}/g}}\nBAR', { collate: true });
// // console.log(ast.nodes[1]);
// console.log(compile(ast, process.env));
// console.log(render('FOO\n${1:$HOME\n${HOME/(.)/${1:up}/g}}\nBAR', {
//   ...process.env,
//   up(val) {
//     return val.toUpperCase();
//   }
// }));

// let ast = parse('${foobarfoobar/(foo)(bar)/ONE${1:+QUX}ABC${2:+FEZ}XYZ/g}', { collate: true });
// let ast = parse('${foobar\\|foobar/(foo)(bar)/ONE${1:?BAZ:QUX}ABC${2:+FEZ}XYZ/g}', { collate: true });

// // let ast = parse('ABC ${foobarfoobar/(foo)(bar)(.*)/${1}_${2}$3/i} XYZ', { collate: true });
// // let node = ast.nodes[0];

// console.log(compile(ast))
