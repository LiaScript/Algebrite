import { run_test } from '../test-harness';

run_test([
  'outer(a,b)',
  'a*b',

  'outer(a,[b1,b2])',
  '[a*b1,a*b2]',

  'outer([a1,a2],b)',
  '[a1*b,a2*b]',

  'H33=hilbert(3)',
  '',

  'H44=hilbert(4)',
  '',

  'H55=hilbert(5)',
  '',

  'H3344=outer(H33,H44)',
  '',

  'H4455=outer(H44,H55)',
  '',

  'H33444455=outer(H33,H44,H44,H55)',
  '',

  'simplify(inner(H3344,H4455)-contract(H33444455,4,5))',
  '0',

  'outer(2,3)',
  '6',

  'outer([1,2],[3,4,5])',
  '[[3,4,5],[6,8,10]]',

  'outer([a,b],[c,d])',
  '[[a*c,a*d],[b*c,b*d]]',

  // vector times matrix gives a rank-3 tensor
  'outer([1,2],[[1,2],[3,4]])',
  '[[[1,2],[3,4]],[[2,4],[6,8]]]',

  'shape(outer([1,2],[[1,2],[3,4]]))',
  '[2,2,2]',

  // three vectors: a[i]*b[j]*c[k]
  'outer([1,2],[3,4],[5,6])',
  '[[[15,18],[20,24]],[[30,36],[40,48]]]',

  'outer([1,i],[1,-i])',
  '[[1,-i],[i,1]]',

  // only the entries involving 1.5 are floats
  'outer([1.5,2],[2,1])',
  '[[3.0,1.5],[4,2]]',

  // contracting outer(u,v) gives the scalar product
  'contract(outer([1,2,3],[4,5,6]))',
  '32',
]);
