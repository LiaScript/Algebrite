import { run_test } from '../test-harness';

// number(x) is 1 for a real numeric atom, else 0;
// isinteger(x) is 1/0 for numbers and stays unevaluated otherwise
run_test([
  'number(1)',
  '1',

  'number(-3)',
  '1',

  'number(1/2)',
  '1',

  'number(1.5)',
  '1',

  'number(1+1)',
  '1',

  'number(x)',
  '0',

  'number(pi)',
  '0',

  'number(i)',
  '0',

  'number(2+i)',
  '0',

  'number([1,2])',
  '0',

  'number("abc")',
  '0',

  'isinteger(0)',
  '1',

  'isinteger(1)',
  '1',

  'isinteger(-5)',
  '1',

  'isinteger(4/2)',
  '1',

  'isinteger(sqrt(4))',
  '1',

  'isinteger(12345678901234567890)',
  '1',

  'isinteger(1/2)',
  '0',

  'isinteger(2.0)',
  '1',

  'isinteger(2.5)',
  '0',

  'isinteger(x)',
  'isinteger(x)',

  'isinteger(pi)',
  'isinteger(pi)',
]);
