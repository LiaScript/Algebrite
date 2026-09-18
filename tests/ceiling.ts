import { run_test } from '../test-harness';

run_test([
  'ceiling(a)',
  'ceiling(a)',

  'ceiling(a+b)',
  'ceiling(a+b)',

  'ceiling(5/2)',
  '3',

  'ceiling(4/2)',
  '2',

  'ceiling(3/2)',
  '2',

  'ceiling(2/2)',
  '1',

  'ceiling(1/2)',
  '1',

  'ceiling(0/2)',
  '0',

  'ceiling(-1/2)',
  '0',

  'ceiling(-2/2)',
  '-1',

  'ceiling(-3/2)',
  '-1',

  'ceiling(-4/2)',
  '-2',

  'ceiling(-5/2)',
  '-2',

  'ceiling(5/2.0)',
  '3.0',

  'ceiling(4/2.0)',
  '2.0',

  'ceiling(3/2.0)',
  '2.0',

  'ceiling(2/2.0)',
  '1.0',

  'ceiling(1/2.0)',
  '1.0',

  'ceiling(0.0)',
  '0.0',

  'ceiling(-1/2.0)',
  '0.0',

  'ceiling(-2/2.0)',
  '-1.0',

  'ceiling(-3/2.0)',
  '-1.0',

  'ceiling(-4/2.0)',
  '-2.0',

  'ceiling(-5/2.0)',
  '-2.0',

  'ceiling(0)',
  '0',

  'ceiling(3)',
  '3',

  'ceiling(-3)',
  '-3',

  'ceiling(1/3)',
  '1',

  'ceiling(-1/3)',
  '0',

  'ceiling(2.5)',
  '3.0',

  'ceiling(-2.5)',
  '-2.0',

  'ceiling(123456789012345678901/10)',
  '12345678901234567891',

  'ceiling(-123456789012345678901/10)',
  '-12345678901234567890',

  'ceiling(pi)',
  'ceiling(pi)',
]);
