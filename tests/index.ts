import { run_test } from '../test-harness';

run_test([
  'A=[[A11,A12],[A21,A22]]',
  '',

  'A[1,1]',
  'A11',

  'A[1,2]',
  'A12',

  'A[2,1]',
  'A21',

  'A[2,2]',
  'A22',

  'A[1]',
  '[A11,A12]',

  'A[1][2]',
  'A12',

  'A[2]',
  '[A21,A22]',

  'A[1]=[B11,B12]',
  '',

  'A',
  '[[B11,B12],[A21,A22]]',

  'A[2]=[B21,B22]',
  '',

  'A',
  '[[B11,B12],[B21,B22]]',

  'A=[[0,0],[0,0]]',
  '',

  'A[1,1]',
  '0',

  // index of scalar should throw an error

  '1[2]',
  'Stop: trying to access a scalar as a tensor',

  // clean up -----------------

  'clearall',
  '',

  // index of a non-allocated tensor
  // or index with a symbol instead of
  // a number

  'a[0]',
  'a[0]',

  'a[0,2]',
  'a[0,2]',

  'a[b]',
  'a[b]',

  'a[b,c]',
  'a[b,c]',

  'a = [1,2,3]',
  '',

  'a[b]',
  'a[b]',

  // --------------------------------
  // indexing matrices and tensors
  // --------------------------------

  'M=[[1,2,3],[4,5,6]]',
  '',

  'M[2,3]',
  '6',

  'M[2]',
  '[4,5,6]',

  // non-integer or symbolic index: left unevaluated
  'M[1.5,1]',
  'M[1.5,1]',

  'M[n,1]',
  'M[n,1]',

  'M[1,2]=x',
  '',

  'M',
  '[[1,x,3],[4,5,6]]',

  'T=[[[1,2],[3,4]],[[5,6],[7,8]]]',
  '',

  'T[2,1,2]',
  '6',

  'T[2,1]',
  '[5,6]',

  'T[2]',
  '[[5,6],[7,8]]',

  'T[2,2]=[p,q]',
  '',

  'T',
  '[[[1,2],[3,4]],[[5,6],[p,q]]]',

  'M[0,1]',
  'Stop: index out of range',

  'M=[[1,2,3],[4,5,6]]',
  '',

  'M[3,1]',
  'Stop: index out of range',

  'M=[[1,2,3],[4,5,6]]',
  '',

  'M[1,4]',
  'Stop: index out of range',

  'M=[[1,2,3],[4,5,6]]',
  '',

  'M[1,1,1]',
  'Stop: too many indices for tensor',

  // assignments with a wrong index or shape must stop
  'M=[[1,2,3],[4,5,6]]',
  '',

  'M[3]=[7,8,9]',
  'Stop: error in indexed assign',

  'M=[[1,2,3],[4,5,6]]',
  '',

  'M[n]=[7,8,9]',
  'Stop: error in indexed assign',

  'M=[[1,2,3],[4,5,6]]',
  '',

  'M[1]=[7,8]',
  'Stop: error in indexed assign',

  'M=[[1,2,3],[4,5,6]]',
  '',

  'M[1,1]=[7,8]',
  'Stop: error in indexed assign',
]);
