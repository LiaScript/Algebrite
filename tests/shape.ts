import { run_test } from '../test-harness';

run_test([
  // see transpose function source to see why
  // transposition has no effect on vectors
  // of dimension (rank) 1

  'shape([A,B,C])',
  '[3]',

  'shape(transpose([A,B,C]))',
  '[3]',

  'shape([[A],[B],[C]])',
  '[3,1]',

  'shape(transpose([[A],[B],[C]]))',
  '[1,3]',

  'shape([[A,B],[C,D],[E,F]])',
  '[3,2]',

  'shape(transpose([[A,B],[C,D],[E,F]]))',
  '[2,3]',

  'shape(zero(2,3))',
  '[2,3]',

  'shape(zero(2,3,4))',
  '[2,3,4]',

  'shape(hilbert(4))',
  '[4,4]',

  'shape([[5]])',
  '[1,1]',

  'shape(0)',
  '0',

  'shape(5)',
  'Stop: shape: tensor expected, 1st arg is not a tensor',

  'shape(a)',
  'Stop: shape: tensor expected, 1st arg is not a tensor',

  // dim(M,k) is the size of index k, 1 by default
  'dim([[1,2,3],[4,5,6]])',
  '2',

  'dim([[1,2,3],[4,5,6]],1)',
  '2',

  'dim([[1,2,3],[4,5,6]],2)',
  '3',

  'dim([1,2,3])',
  '3',

  'dim(zero(2,3,4),3)',
  '4',

  // a scalar has dimension 1
  'dim(5)',
  '1',

  // no such index: left unevaluated
  'dim([[1,2,3],[4,5,6]],3)',
  'dim([[1,2,3],[4,5,6]],3)',

  'dim([[1,2,3],[4,5,6]],0)',
  'dim([[1,2,3],[4,5,6]],0)',

  'dim([[1,2,3],[4,5,6]],n)',
  'dim([[1,2,3],[4,5,6]],n)',
]);
