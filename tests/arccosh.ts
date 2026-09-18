import { run_test } from '../test-harness';

run_test([
  'arccosh(1.0)',
  '0.0',

  'arccosh(1)',
  '0',

  // arccosh(cosh(x)) is abs(x), not x: arccosh(cosh(-2)) is 2
  'arccosh(cosh(x))',
  'arccosh(cosh(x))',

  'arccosh(cosh(-2))',
  '2',

  'arccosh(cosh(3))',
  '3',

  'arccosh(cosh(0))',
  '0',

  'arccosh(2.0)',
  '1.316958...',

  'float(arccosh(2))',
  '1.316958...',

  'arccosh(2)',
  'arccosh(2)',

  // below 1 there is no real value
  'arccosh(0.5)',
  'Stop: arccosh function argument is less than 1.0',

  'arccosh(-1.0)',
  'Stop: arccosh function argument is less than 1.0',

  'arccosh(x)',
  'arccosh(x)',

  'd(arccosh(x),x)',
  '1/((x^2-1)^(1/2))',
]);
