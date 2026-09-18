import { run_test } from '../test-harness';

// Exact eigenvalues/eigenvectors of any square matrix: roots of the
// characteristic polynomial, then nullspace(A-lambda*I) for each root.
// eigenvalues lists each distinct eigenvalue once, eigenvectors has one row
// per basis vector, grouped in the same order. Each vector v below was
// checked by hand with A v = lambda v.
run_test([
  // symmetric: A[-1,1] = [-1,1], A[1,1] = 3[1,1]
  'eigenvalues([[2,1],[1,2]])',
  '[1,3]',

  'eigenvectors([[2,1],[1,2]])',
  '[[-1,1],[1,1]]',

  // not symmetric: trace 7, det 10. A[-1/2,1] = [-1,2], A[1,1] = [5,5]
  'eigenvalues([[4,1],[2,3]])',
  '[2,5]',

  'eigenvectors([[4,1],[2,3]])',
  '[[-1/2,1],[1,1]]',

  // not diagonalizable: eigenvalue 2 twice, but only one eigenvector
  'eigenvalues([[2,1],[0,2]])',
  '[2]',

  'eigenvectors([[2,1],[0,2]])',
  '[[1,0]]',

  // rotation: A[-i,1] = [-1,-i] = -i[-i,1], A[i,1] = [-1,i] = i[i,1]
  'eigenvalues([[0,-1],[1,0]])',
  '[-i,i]',

  'eigenvectors([[0,-1],[1,0]])',
  '[[-i,1],[i,1]]',

  // irrational: lambda^2 = lambda+1, so A[lambda,1] = [lambda+1,lambda]
  // = lambda[lambda,1]. The vectors are [lambda,1], written as
  // -1/(1-lambda) = lambda since lambda(1-lambda) = -1; there is no
  // rationalisation of radical denominators yet.
  'eigenvalues([[1,1],[1,0]])',
  '[1/2-1/2*5^(1/2),1/2+1/2*5^(1/2)]',

  'eigenvectors([[1,1],[1,0]])',
  '[[-1/(1/2+1/2*5^(1/2)),1],[-1/(1/2-1/2*5^(1/2)),1]]',

  // 3x3: A[0,-2,1] = [0,-2,1], A[1,0,0] = 2[1,0,0],
  // A[0,1/2,1] = [0,11/2,11]
  'eigenvalues([[2,0,0],[0,3,4],[0,4,9]])',
  '[1,2,11]',

  'eigenvectors([[2,0,0],[0,3,4],[0,4,9]])',
  '[[0,-2,1],[1,0,0],[0,1/2,1]]',

  // repeated eigenvalue with a two dimensional eigenspace
  'eigenvectors([[2,0,0],[0,2,0],[0,0,3]])',
  '[[1,0,0],[0,1,0],[0,0,1]]',

  // 4x4, eigenvalue 3 three times: A[-1,1,0,0] = [-1,1,0,0],
  // A[1,1,0,0] = 3[1,1,0,0], e3 and e4 are fixed up to the factor 3
  'eigenvalues([[2,1,0,0],[1,2,0,0],[0,0,3,0],[0,0,0,3]])',
  '[1,3]',

  'eigenvectors([[2,1,0,0],[1,2,0,0],[0,0,3,0],[0,0,0,3]])',
  '[[-1,1,0,0],[1,1,0,0],[0,0,1,0],[0,0,0,1]]',

  // symbolic: (a-lambda)^2 = b^2, lambda = a+-sqrt(b^2) = a+-abs(b)
  'eigenvalues([[a,b],[b,a]])',
  '[a+abs(b),a-abs(b)]',

  // A[b/abs(b),1] = [a*b/abs(b)+b, abs(b)+a] = (a+abs(b))[b/abs(b),1],
  // likewise for a-abs(b)
  'eigenvectors([[a,b],[b,a]])',
  '[[b/abs(b),1],[-b/abs(b),1]]',

  // the variable of the characteristic polynomial is internal, so a bound
  // or free x in the matrix does not interfere
  'eigenvalues([[x,0],[0,2]])',
  '[2,x]',

  'x=5',
  '',

  'eigenvalues([[x,1],[1,x]])',
  '[4,6]',

  'x=quote(x)',
  '',

  'eigenvalues([1,2])',
  'Stop: eigenvalues: square matrix expected',

  'eigenvectors([[1,2,3],[4,5,6]])',
  'Stop: eigenvectors: square matrix expected',
]);
