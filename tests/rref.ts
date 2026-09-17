import { run_test } from '../test-harness';

// rref, nullspace and matrixrank share one exact Gauss-Jordan reduction.
// (rank() is already taken: it is the tensor rank, 2 for every matrix.)
run_test([
  'rref([[1,2],[3,4]])',
  '[[1,0],[0,1]]',

  'rref([[1,2],[2,4]])',
  '[[1,2],[0,0]]',

  'rref([[1,2,3],[4,5,6],[7,8,9]])',
  '[[1,0,-1],[0,1,2],[0,0,0]]',

  'rref([[2,4,6],[1,1,1]])',
  '[[1,0,-1],[0,1,2]]',

  // needs a row swap
  'rref([[0,1],[1,0]])',
  '[[1,0],[0,1]]',

  // augmented matrix of x+y=3, x-y=1
  'rref([[1,1,3],[1,-1,1]])',
  '[[1,0,2],[0,1,1]]',

  // symbolic entries are taken as nonzero pivots
  'rref([[a,b],[c,d]])',
  '[[1,0],[0,1]]',

  'rref([1,2,3])',
  'Stop: rref: matrix expected',

  // the rows of the result are a basis of the null space
  'nullspace([[1,2],[2,4]])',
  '[[-2,1]]',

  'nullspace([[1,2,3],[4,5,6],[7,8,9]])',
  '[[1,-2,1]]',

  'nullspace([[1,1,1]])',
  '[[-1,1,0],[-1,0,1]]',

  'dot([[1,2,3],[4,5,6],[7,8,9]],transpose(nullspace([[1,2,3],[4,5,6],[7,8,9]])))',
  '[[0],[0],[0]]',

  // only the zero vector: there is no empty-list value to return
  'nullspace([[1,2],[3,4]])',
  '[[0,0]]',

  'matrixrank([[1,2],[3,4]])',
  '2',

  'matrixrank([[1,2],[2,4]])',
  '1',

  'matrixrank([[1,2,3],[4,5,6],[7,8,9]])',
  '2',

  'matrixrank(zero(2,2))',
  '0',
]);
