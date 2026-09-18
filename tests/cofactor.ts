import { run_test } from '../test-harness';

run_test([
  'cofactor([[1,2],[3,4]],1,1)',
  '4',

  'cofactor([[1,2],[3,4]],1,2)',
  '-3',

  'cofactor([[1,2],[3,4]],2,1)',
  '-2',

  'cofactor([[1,2],[3,4]],2,2)',
  '1',

  'cofactor([[1,2,3],[4,5,6],[7,8,9]],1,2)',
  '6',

  // 1x1: the empty minor has determinant 1
  'cofactor([[7]],1,1)',
  '1',

  'cofactor([[a,b,c],[d,e1,f],[g,h,k]],2,3)',
  '-a*h+b*g',

  'cofactor([[a,b,c],[d,e1,f],[g,h,k]],3,3)',
  'a*e1-b*d',

  'cofactor([[1,2],[3,4]],3,1)',
  'Stop: cofactor: 2nd arg: row index expected',

  'cofactor([[1,2],[3,4]],0,1)',
  'Stop: cofactor: 2nd arg: row index expected',

  'cofactor([[1,2],[3,4]],1,3)',
  'Stop: cofactor: 3rd arg: column index expected',

  // non-integer, symbolic or missing indices must stop, not pick an entry
  'cofactor([[1,2],[3,4]],1.5,1)',
  'Stop: cofactor: 2nd arg: row index expected',

  'cofactor([[1,2],[3,4]],n,1)',
  'Stop: cofactor: 2nd arg: row index expected',

  'cofactor([[1,2],[3,4]],1)',
  'Stop: cofactor: 3rd arg: column index expected',

  'cofactor([[1,2,3],[4,5,6]],1,1)',
  'Stop: cofactor: 1st arg: square matrix expected',

  'cofactor([1,2],1,1)',
  'Stop: cofactor: 1st arg: square matrix expected',

  'cofactor(a,1,1)',
  'Stop: cofactor: 1st arg: square matrix expected',
]);
