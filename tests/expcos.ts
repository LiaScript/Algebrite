import { run_test } from '../test-harness';

run_test([
  'expcos(x)',
  '1/2*exp(-i*x)+1/2*exp(i*x)',

  'expcos(0)',
  '1',

  'expcos(pi)',
  '-1',

  // even function
  'expcos(-x)',
  '1/2*exp(-i*x)+1/2*exp(i*x)',

  // cos(i x) = cosh(x)
  'expcos(i*x)',
  '1/2*exp(x)+1/2*exp(-x)',

  'expsin(x)^2+expcos(x)^2',
  '1',
]);
