import { run_test } from '../test-harness';

run_test([
  'eigen(A)',
  'Stop: eigen: argument is not a square matrix',

  'eigenval(A)',
  'eigenval(A)',

  'eigenvec(A)',
  'eigenvec(A)',

  'eigen([1,2])',
  'Stop: eigen: argument is not a square matrix',

  'eigen([[1,2],[1,2]])',
  'Stop: eigen: matrix is not symmetrical',

  'eigenval([[1,1,1,1],[1,2,3,4],[1,3,6,10],[1,4,10,20]])',
  '[[0.038016...,0.0,0.0,0.0],[0.0,0.453835...,0.0,0.0],[0.0,0.0,2.203446...,0.0],[0.0,0.0,0.0,26.304703...]]',

  'eigenvec([[1,1,1,1],[1,2,3,4],[1,3,6,10],[1,4,10,20]])',
  '[[0.308686...,-0.723090...,0.594551...,-0.168412...],[0.787275...,-0.163234...,-0.532107...,0.265358...],[0.530366...,0.640332...,0.391832...,-0.393897...],[0.060187...,0.201173...,0.458082...,0.863752...]]',
  'eigen(hilbert(20))',
  '',

  // "contract" is the trace, but "trace" is a debugging flag in
  // Algebrite/Eigenmath
  // this one takes quite some time to finish because of the
  // "dot(transpose(Q),D,Q))" calculation. Note that since
  // D and Q are matrices of doubles, the whole result is a double.
  // also note that the result gives "-0.000000...", that's why I put the abs there
  // Note that this should be really "0" however, because of calculation errors,
  // it doesn't test equal to "0", so we get to this result
  'abs(contract(hilbert(20))-contract(dot(transpose(Q),D,Q)))',
  '0.000000...',

  'D=quote(D)',
  '',

  'Q=quote(Q)',
  '',

  'A=hilbert(3)',
  '',

  'eigen(A)',
  '',

  'D-eigenval(A)',
  '[[0,0,0],[0,0,0],[0,0,0]]',

  'Q-eigenvec(A)',
  '[[0,0,0],[0,0,0],[0,0,0]]',

  'A=quote(A)',
  '',

  'D=quote(D)',
  '',

  'Q=quote(Q)',
  '',

  // rows of eigenvec are the eigenvectors, in the order of the diagonal of
  // eigenval: [2,1],[1,2] * [1,1] = 3*[1,1], * [-1,1] = 1*[-1,1]
  'eigenval([[2,1],[1,2]])',
  '[[3.000000...,0.0],[0.0,1.000000...]]',

  'eigenvec([[2,1],[1,2]])',
  '[[0.707107...,0.707107...],[-0.707107...,0.707107...]]',

  // eigen sets D and Q, with Q*A*transpose(Q) = D
  'eigen([[2,1],[1,2]])',
  '',

  'D',
  '[[3.000000...,0.0],[0.0,1.000000...]]',

  'Q',
  '[[0.707107...,0.707107...],[-0.707107...,0.707107...]]',

  'D=quote(D)',
  '',

  'Q=quote(Q)',
  '',

  // [0,1],[1,0] * [-1,1] = -1*[-1,1]
  'eigenval([[0,1],[1,0]])',
  '[[1.000000...,0.0],[0.0,-1.000000...]]',

  'eigenvec([[0,1],[1,0]])',
  '[[0.707107...,0.707107...],[-0.707107...,0.707107...]]',

  'eigenval([[5]])',
  '[[5.0]]',

  'eigenvec([[5]])',
  '[[1.0]]',

  'eigenval(unit(2))',
  '[[1.0,0.0],[0.0,1.0]]',

  'eigenval(zero(2,2))',
  '[[0.0,0.0],[0.0,0.0]]',

  'eigenvec(zero(2,2))',
  '[[1.0,0.0],[0.0,1.0]]',

  'eigenval([[1/2,0],[0,1/3]])',
  '[[0.5,0.0],[0.0,0.333333...]]',

  'eigenval([[1.5,0.5],[0.5,1.5]])',
  '[[2.000000...,0.0],[0.0,1.000000...]]',

  // block [3,4],[4,9]: trace 12, det 11, so 1 and 11;
  // eigenvectors [2,-1] for 1 and [1,2] for 11
  'eigenval([[2,0,0],[0,3,4],[0,4,9]])',
  '[[2.0,0.0,0.0],[0.0,1.0,0.0],[0.0,0.0,11.000000...]]',

  'eigenvec([[2,0,0],[0,3,4],[0,4,9]])',
  '[[1.0,0.0,0.0],[0.0,0.894427...,-0.447214...],[0.0,0.447214...,0.894427...]]',

  // checked against numpy.linalg.eigh
  'eigenval([[4,1,2,3],[1,5,1,2],[2,1,6,1],[3,2,1,7]])',
  '[[1.735486...,0.0,0.0,0.0],[0.0,4.0,0.0,0.0],[0.0,0.0,10.845270...,0.0],[0.0,0.0,0.0,5.419244...]]',

  // Jacobi is for real symmetric matrices only
  'eigenval([[1,2],[3,4]])',
  'Stop: eigen: matrix is not symmetrical',

  'eigenval([[a,b],[b,c]])',
  'Stop: eigen: matrix is not numerical',

  // Hermitian but complex: not supported
  'eigenval([[1,i],[-i,1]])',
  'Stop: eigen: matrix is not numerical',

  'eigenval([[1,2,3],[4,5,6]])',
  'Stop: eigen: argument is not a square matrix',

  'eigenvec([[1,2],[3,4]])',
  'Stop: eigen: matrix is not symmetrical',
]);
