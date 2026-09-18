import { run_test } from '../test-harness';

run_test([
  'round(a)',
  'round(a)',

  'round(a+b)',
  'round(a+b)',

  'round(5/2)',
  '3',

  'round(5/2 - 1/10)',
  '2',

  'round(4/2)',
  '2',

  'round(3/2)',
  '2',

  'round(2/2)',
  '1',

  'round(1/2)',
  '1',

  'round(0/2)',
  '0',

  'round(-1/2)',
  '0',

  'round(-2/2)',
  '-1',

  'round(-3/2)',
  '-1',

  'round(-4/2)',
  '-2',

  'round(-5/2)',
  '-2',

  'round(-5/2 + 1/10)',
  '-2',

  'round(5/2) - round(5/2.0)',
  '0.0',

  'round(4/2) - round(4/2.0)',
  '0.0',

  'round(3/2) - round(3/2.0)',
  '0.0',

  'round(2/2) - round(2/2.0)',
  '0.0',

  'round(1/2) - round(1/2.0)',
  '0.0',

  'round(0.0)',
  '0.0',

  'round(-1/2) - round(-1/2.0)',
  '0.0',

  'round(-2/2) - round(-2/2.0)',
  '0.0',

  'round(-3/2) - round(-3/2.0)',
  '0.0',

  'round(-4/2) - round(-4/2.0)',
  '0.0',

  'round(-5/2) - round(-5/2.0)',
  '0.0',

  'round(0)',
  '0',

  'round(-3)',
  '-3',

  'round(1/3)',
  '0',

  'round(-1/3)',
  '0',

  'round(2/3)',
  '1',

  'round(7/2)',
  '4',

  'round(-7/2)',
  '-3',

  'round(2.5)',
  '3.0',

  'round(-2.5)',
  '-2.0',

  'round(1.4999)',
  '1.0',

  // exact for big rationals (float conversion lost digits here)
  'round(123456789012345678901/10)',
  '12345678901234567890',

  'round(123456789012345678905/10)',
  '12345678901234567891',

  'round(-123456789012345678905/10)',
  '-12345678901234567890',

  'round(12345678901234567890)',
  '12345678901234567890',

  'round(pi)',
  'round(pi)',

  'round(x)+round(x)',
  '2*round(x)',
]);
