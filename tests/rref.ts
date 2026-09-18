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

  // ---- rref edge cases ----
  'rref([[5]])',
  '[[1]]',

  'rref([[0]])',
  '[[0]]',

  'rref(zero(2,3))',
  '[[0,0,0],[0,0,0]]',

  'rref(unit(3))',
  '[[1,0,0],[0,1,0],[0,0,1]]',

  // tall full-rank matrix
  'rref([[1,2],[3,4],[5,6]])',
  '[[1,0],[0,1],[0,0]]',

  // zero first column: pivots in columns 2 and 3
  'rref([[0,2,4],[0,1,3]])',
  '[[0,1,0],[0,0,1]]',

  // free variables in columns 2 and 4
  'rref([[1,2,1,0],[2,4,0,2],[3,6,1,2]])',
  '[[1,2,0,1],[0,0,1,-1],[0,0,0,0]]',

  'rref([[1/2,1/3],[1/4,1/6]])',
  '[[1,2/3],[0,0]]',

  'rref([[1.5,2],[3,4]])',
  '[[1.0,1.333333...],[0,0]]',

  // second row is i times the first
  'rref([[1,i],[i,-1]])',
  '[[1,i],[0,0]]',

  'rref([[1,i],[2,3]])',
  '[[1,0],[0,1]]',

  'rref([[a,a],[b,b]])',
  '[[1,1],[0,0]]',

  'rref(5)',
  'Stop: rref: matrix expected',

  'rref([[[1]]])',
  'Stop: rref: matrix expected',

  // ---- nullspace edge cases ----
  // zero matrix: every vector, the standard basis
  'nullspace(zero(2,3))',
  '[[1,0,0],[0,1,0],[0,0,1]]',

  'nullspace([[0]])',
  '[[1]]',

  'nullspace([[5]])',
  '[[0]]',

  'nullspace(unit(3))',
  '[[0,0,0]]',

  'nullspace([[1,2],[3,4],[5,6]])',
  '[[0,0]]',

  // x1 = -2*x2 - x4, x3 = x4
  'nullspace([[1,2,1,0],[2,4,0,2],[3,6,1,2]])',
  '[[-2,1,0,0],[-1,0,1,1]]',

  'dot([[1,2,1,0],[2,4,0,2],[3,6,1,2]],transpose(nullspace([[1,2,1,0],[2,4,0,2],[3,6,1,2]])))',
  '[[0,0],[0,0],[0,0]]',

  'nullspace([[1,2,3]])',
  '[[-2,1,0],[-3,0,1]]',

  // 1*(-i)+i*1 = 0 and i*(-i)-1 = 0
  'nullspace([[1,i],[i,-1]])',
  '[[-i,1]]',

  'nullspace([[1.5,3],[1,2]])',
  '[[-2.0,1]]',

  'nullspace(5)',
  'Stop: nullspace: matrix expected',

  'nullspace([1,2])',
  'Stop: nullspace: matrix expected',

  // ---- matrixrank edge cases ----
  'matrixrank([[5]])',
  '1',

  'matrixrank([[0]])',
  '0',

  'matrixrank([[1,2,3],[2,4,6]])',
  '1',

  'matrixrank([[1,2],[2,4],[3,6]])',
  '1',

  'matrixrank([[1,2],[3,4],[5,6]])',
  '2',

  'matrixrank(unit(4))',
  '4',

  // row 4 = row 1 - row 3, row 2 = 2*row 1
  'matrixrank([[1,2,3,4],[2,4,6,8],[1,0,1,0],[0,2,2,4]])',
  '2',

  'matrixrank(hilbert(5))',
  '5',

  'matrixrank([[1.5,2],[3,4]])',
  '1',

  'matrixrank([[1/2,1/3],[1/4,1/6]])',
  '1',

  'matrixrank([[1,i],[i,-1]])',
  '1',

  'matrixrank([[a,b],[c,d]])',
  '2',

  'matrixrank(5)',
  'Stop: matrixrank: matrix expected',

  'matrixrank([1,2,3])',
  'Stop: matrixrank: matrix expected',

  // rank() is the tensor rank (number of indices), not the matrix rank
  'rank(5)',
  '0',

  'rank([1,2,3])',
  '1',

  'rank(zero(2,3))',
  '2',

  'rank(zero(2,2))',
  '2',

  'rank([[[1]]])',
  '3',
]);
