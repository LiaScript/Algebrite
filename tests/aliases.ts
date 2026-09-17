import { run_test } from '../test-harness';

// Standard names defined in terms of existing functions.
run_test([
  'log10(1000)',
  '3',

  'log10(x)',
  'log(x)/log(10)',

  'log10(2)',
  'log(2)/log(10)',

  'log2(8)',
  '3',

  'log2(1/4)',
  '-2',

  'cbrt(27)',
  '3',

  'cbrt(x)',
  'x^(1/3)',

  'root(32,5)',
  '2',

  'root(x,n)',
  'x^(1/n)',

  'sech(0)',
  '1',

  'sech(x)',
  '1/(cosh(x))',

  'csch(x)',
  '1/(sinh(x))',

  'coth(x)',
  '1/(tanh(x))',

  'd(sech(x),x)',
  '-sinh(x)/(cosh(x)^2)',

  'float(sech(1))',
  '0.648054...',

  'arcsech(x)',
  'arccosh(1/x)',

  'arccsch(x)',
  'arcsinh(1/x)',

  'arccoth(x)',
  'arctanh(1/x)',
]);
