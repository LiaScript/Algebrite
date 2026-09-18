import { run_test } from '../test-harness';

run_test([
  'arcsinh(0.0)',
  '0.0',

  'arcsinh(0)',
  '0',

  // sinh is a bijection on the reals, so this holds for every real x
  'arcsinh(sinh(x))',
  'x',

  'arcsinh(1.0)',
  '0.881374...',

  'arcsinh(-1.0)',
  '-0.881374...',

  'float(arcsinh(1))',
  '0.881374...',

  'arcsinh(x)',
  'arcsinh(x)',

  'd(arcsinh(x),x)',
  '1/((x^2+1)^(1/2))',
]);
