import { run_test } from '../test-harness';

run_test([
  'erf(a)',
  'erf(a)',

  'erf(0.0) + 1',
  '1.0',

  'float(erf(0))',
  '0.0',

  'erf(0.0)',
  '0.0',

  'erf(-0.0)',
  '0.0',

  'erf(0)',
  '0',

  'erf(-0)',
  '0',

  'float(erf(0)) + 1',
  '1.0',

  'float(erf(1))',
  '0.842701...',

  // odd
  'erf(-x)',
  '-erf(x)',

  'erf(-2)',
  '-erf(2)',

  'erf(-1.0)',
  '-0.842701...',

  'erf(0.5)',
  '0.520500...',

  'erf(3.0)',
  '0.999978...',

  'erf(x)+erf(-x)',
  '0',

  // chain rule
  'd(erf(2*x),x)',
  '4*exp(-4*x^2)/(pi^(1/2))',

  'float(erf(1)+erfc(1))',
  '1.0',

  // wrong number of arguments
  'erf()',
  'Stop: erf: expected 1 argument, got 0',

  'erf(1,2)',
  'Stop: erf: expected 1 argument, got 2',
]);
