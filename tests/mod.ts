import { run_test } from '../test-harness';

run_test([
  'mod(2.0,3.0)',
  '2',

  'mod(-2.0,3.0)',
  '-2',

  'mod(2.0,-3.0)',
  '2',

  'mod(-2.0,-3.0)',
  '-2',

  'mod(2,3)',
  '2',

  'mod(-2,3)',
  '-2',

  'mod(2,-3)',
  '2',

  'mod(-2,-3)',
  '-2',

  'mod(a,b)',
  'mod(a,b)',

  'mod(2.0,0.0)',
  'Stop: mod function: divide by zero',

  'mod(2,0)',
  'Stop: mod function: divide by zero',

  'mod(1.2,2)',
  'Stop: mod function: cannot convert float value to integer',

  'mod(1/2,3)',
  'Stop: mod function: integer arguments expected',

  'mod(15,8.0)',
  '7',

  'mod(7,3)',
  '1',

  'mod(-7,3)',
  '-1',

  'mod(7,-3)',
  '1',

  'mod(0,5)',
  '0',

  'mod(5,1)',
  '0',

  'mod(6,3)',
  '0',

  'mod(12345678901234567890,97)',
  '3',

  'mod(2^100,7)',
  '2',

  'mod(x,3)',
  'mod(x,3)',

  'mod(7.5,2)',
  'Stop: mod function: cannot convert float value to integer',
]);
