import { run_test } from '../test-harness';

run_test([
  'bessely(n,x)',
  'bessely(n,x)',

  // Y_(-n) = (-1)^n Y_n
  'bessely(-1,x)',
  '-bessely(1,x)',

  'bessely(-2,x)',
  'bessely(2,x)',

  'd(bessely(n,x),x)',
  'bessely(-1+n,x)-n*bessely(n,x)/x',

  // numeric values (tables of Abramowitz and Stegun)
  'bessely(0,1.0)',
  '0.088257...',

  'bessely(1,1.0)',
  '-0.781213...',

  'bessely(2,2.0)',
  '-0.617408...',

  'bessely(0,10.0)',
  '0.055671...',

  'bessely(1,0.1)',
  '-6.458951...',

  'bessely(-1,1.0)',
  '0.781213...',

  // Y_n has a singularity at 0 and is complex for x < 0
  'bessely(0,0.0)',
  'Stop: bessely: x must be positive',

  // wrong number of arguments
  'bessely(x)',
  'Stop: bessely: expected 2 arguments, got 1',

  // Y0(1) = 0.0882569642
  'float(bessely(0,1))',
  '0.088257...',

  // Y0' = -Y1 (not -J1)
  'd(bessely(0,x),x)',
  '-bessely(1,x)',
]);
