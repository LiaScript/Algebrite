import { run_test } from '../test-harness';

run_test([
  'cosh(x)',
  'cosh(x)',

  'cosh(0)',
  '1',

  'cosh(arccosh(x))',
  'x',

  'cosh(0.0)',
  '1.0',

  'cosh(1.0)',
  '1.543081...',

  // even function
  'cosh(-1.0)',
  '1.543081...',

  'float(cosh(1))',
  '1.543081...',

  'd(cosh(x),x)',
  'sinh(x)',

  'integral(cosh(x),x)',
  'sinh(x)',
]);
