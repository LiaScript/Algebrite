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

  // numeric values (tables of Abramowitz and Stegun)
  'bessely(1.0,0)',
  '0.088257...',

  'bessely(1.0,1)',
  '-0.781213...',

  'bessely(2.0,2)',
  '-0.617408...',

  'bessely(10.0,0)',
  '0.055671...',

  'bessely(0.1,1)',
  '-6.458951...',

  'bessely(1.0,-1)',
  '0.781213...',

  // Y_n has a singularity at 0 and is complex for x < 0
  'bessely(0.0,0)',
  'Stop: bessely: x must be positive',

  // wrong number of arguments
  'bessely(x)',
  'Stop: bessely: expected 2 arguments, got 1',
]);
