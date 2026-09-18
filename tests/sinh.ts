import { run_test } from '../test-harness';

run_test([
  'sinh(x)',
  'sinh(x)',

  'sinh(0)',
  '0',

  'sinh(arcsinh(x))',
  'x',

  'sinh(0.0)',
  '0.0',

  'sinh(1.0)',
  '1.175201...',

  'sinh(-1.0)',
  '-1.175201...',

  'float(sinh(1))',
  '1.175201...',

  'd(sinh(x),x)',
  'cosh(x)',

  'integral(sinh(x),x)',
  'cosh(x)',

  'circexp(sinh(x))',
  '1/2*exp(x)-1/2*exp(-x)',
]);
