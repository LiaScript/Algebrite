import { run_test } from '../test-harness';

// trace(M) is the sum of the diagonal, via the existing contract().
run_test([
  'trace([[1,2],[3,4]])',
  '5',

  'trace([[a,b],[c,d]])',
  'a+d',

  'trace(identity(4))',
  '4',

  'trace([[x,1],[1,x]])',
  '2*x',
]);
