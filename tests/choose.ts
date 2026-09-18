import { run_test } from '../test-harness';

run_test([
  'choose(52,5)',
  '2598960',

  'choose(n,k)',
  'n!/(k!*(-k+n)!)',

  'choose(0,k)',
  '1/(k!*(-k)!)',

  'choose(n,0)',
  '1',

  // same as binomial: (-1)^k for integer k >= 0, not 0
  'choose(-1,k)',
  'binomial(-1,k)',

  'choose(n,-1)',
  '0',

  'choose(5,2)',
  '10',

  'choose(10,0)',
  '1',

  'choose(10,10)',
  '1',

  'choose(3,5)',
  '0',

  'choose(60,30)',
  '118264581564861424',

  'choose(-3,2)',
  '6',

  'choose(1/2,2)',
  '-1/8',
]);
