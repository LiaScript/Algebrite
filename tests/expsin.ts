import { run_test } from '../test-harness';

run_test([
  'expsin(x)',
  '1/2*i*exp(-i*x)-1/2*i*exp(i*x)',

  'expsin(0)',
  '0',

  'expsin(pi/2)',
  '1',

  // odd function
  'expsin(-x)',
  '-1/2*i*exp(-i*x)+1/2*i*exp(i*x)',

  // sin(i x) = i sinh(x)
  'expsin(i*x)',
  '1/2*i*exp(x)-1/2*i*exp(-x)',
]);
