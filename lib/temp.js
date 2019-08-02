
// console.log(slice(arr));
// console.log(slice(arr, 1, 2));
// console.log(slice(arr, 1, 1));
// console.log(slice(arr, 0, 1));
// console.log(slice(arr, -1, arr.length - 1));
// console.log(slice(arr, -2, arr.length - 2));


const state = {
  lines: ['a', 'b', 'c', 'd', 'e'],
  offset: 10
};

const up = () => (state.offset--);
const down = () => (state.offset++);

const render = () => {
  let abs = Math.min(state.lines.length, Math.abs(state.offset));
  let offset = state.offset >= 0 ? abs : -abs;

  // console.log(offset);
};

render();

console.log('-5', wrap(state.lines, -5));
console.log('-4', wrap(state.lines, -4));
console.log('-3', wrap(state.lines, -3));
console.log('-2', wrap(state.lines, -2));
console.log('-1', wrap(state.lines, -1));
console.log(' 0', wrap(state.lines, 0));
console.log(' 1', wrap(state.lines, 1));
console.log(' 2', wrap(state.lines, 2));
console.log(' 3', wrap(state.lines, 3));
console.log(' 4', wrap(state.lines, 4));
console.log(' 5', wrap(state.lines, 5));


// console.log(swap(state.lines));
// console.log(swap(state.lines));
// console.log(swap(state.lines));
