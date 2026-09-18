import { run_test } from '../test-harness';

run_test([
  'bessely(x,n)',
  'bessely(x,n)',

  // Y_(-n) = (-1)^n Y_n
  'bessely(x,-1)',
  '-bessely(x,1)',

  'bessely(x,-2)',
  'bessely(x,2)',

  'd(bessely(x,n),x)',
  'bessely(x,-1+n)-n*bessely(x,n)/x',

  // wrong number of arguments
  'bessely(x)',
  'Stop: bessely: expected 2 arguments, got 1',
]);
