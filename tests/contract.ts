import { run_test } from '../test-harness';

run_test([
  'contract(0)',
  '0',

  'contract(0.0)',
  '0',

  // this is same as contract(hilbertmatrix(20))
  // we are testing this because some versions of bigInt library
  // seemed to give problems with some gcds involved in these
  // additions of fractions
  '409741429887649/166966608033225 + 1/39',
  '414022624965424/166966608033225',

  // this is same as contract(hilbertmatrix(21))
  // we are testing this because some versions of bigInt library
  // seemed to give problems with some gcds involved in these
  // additions of fractions
  '414022624965424/166966608033225 + 1/41',
  '17141894231615609/6845630929362225',

  'contract(hilbert(50))',
  '3200355699626285671281379375916142064964/1089380862964257455695840764614254743075',

  'contract([[a,b],[c,d]])',
  'a+d',

  'contract([[1,2],[3,4]],1,2)',
  '5',

  'A=[[a11,a12],[a21,a22]]',
  '',

  'B=[[b11,b12],[b21,b22]]',
  '',

  'contract(outer(A,B),2,3)',
  '[[a11*b11+a12*b21,a11*b12+a12*b22],[a21*b11+a22*b21,a21*b12+a22*b22]]',

  'A=quote(A)',
  '',

  'B=quote(B)',
  '',

  'contract([[5]])',
  '5',

  'contract(unit(3))',
  '3',

  'contract([[5.5,1],[2,1.5]])',
  '7.0',

  'contract([[1,i],[2,i]])',
  '1+i',

  // rank-3 tensor T[i,j,k]
  'T=[[[1,2],[3,4]],[[5,6],[7,8]]]',
  '',

  // T[i,i,k]: [1+7,2+8]
  'contract(T)',
  '[8,10]',

  'contract(T,1,2)',
  '[8,10]',

  // T[i,j,i]: [1+6,3+8]
  'contract(T,1,3)',
  '[7,11]',

  'contract(T,3,1)',
  '[7,11]',

  // T[i,j,j]: [1+4,5+8]
  'contract(T,2,3)',
  '[5,13]',

  // result of shape [1] stays a vector
  'contract([[[1],[2]],[[3],[4]]])',
  '[5]',

  'contract(T,1,1)',
  'Stop: contract: index out of range',

  'T=[[[1,2],[3,4]],[[5,6],[7,8]]]',
  '',

  'contract(T,1,4)',
  'Stop: contract: index out of range',

  // the two indices must have the same dimension
  'contract([[1,2,3],[4,5,6]])',
  'Stop: contract: index out of range',

  'contract([1,2,3])',
  'Stop: contract: index out of range',

  // symbolic or missing index must stop, not return garbage
  'contract([[1,2],[3,4]],n,m)',
  'Stop: contract: index out of range',

  'contract([[1,2],[3,4]],1)',
  'Stop: contract: index out of range',

  'contract(a)',
  'Stop: contract: tensor expected, 1st arg is not a tensor',
]);
