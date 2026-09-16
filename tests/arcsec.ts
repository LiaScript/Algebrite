import { run_test } from '../test-harness';

// arcsec/arccsc/arccot rewrite to arccos(1/x), arcsin(1/x), arctan(1/x).
// arccot(0) is not covered: 1/0 stops with "divide by zero".
run_test([
  'arcsec(2)',
  '1/3*pi',

  'arcsec(1)',
  '0',

  'arcsec(x)',
  'arccos(1/x)',

  'arccsc(2)',
  '1/6*pi',

  'arccsc(x)',
  'arcsin(1/x)',

  'arccot(1)',
  '1/4*pi',

  'arccot(x)',
  'arctan(1/x)',

  'd(arccot(x),x)',
  '-1/(x^2+1)',
]);
