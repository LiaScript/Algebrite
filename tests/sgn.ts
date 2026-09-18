import { run_test } from '../test-harness';

run_test([
  'sgn(-3)',
  '-1',

  'sgn(0)',
  '0',

  'sgn(3)',
  '1',

  'sgn(-1/2)',
  '-1',

  'sgn(1/2)',
  '1',

  'sgn(0.5)',
  '1',

  'sgn(-2.5)',
  '-1',

  'sgn(0.0)',
  '0',

  'sgn(12345678901234567890)',
  '1',

  'sgn(-12345678901234567890)',
  '-1',

  'sgn(x)',
  'sgn(x)',

  'sgn(-x)',
  '-sgn(x)',

  // complex numbers: sgn(z) = z/abs(z)
  'sgn(i)',
  'i',

  'sgn(-i)',
  '-i',

  'sgn(3-4*i)',
  '3/5-4/5*i',

  'sgn(1+i)',
  '1/2^(1/2)+i/(2^(1/2))',

  'sgn(1.0+i)',
  '0.707107...+0.707107...*i',

  'd(sgn(x),x)',
  '2*dirac(x)',
]);
