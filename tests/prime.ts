import { run_test } from '../test-harness';

run_test([
  'prime(1)',
  '2',

  'prime(2)',
  '3',

  'prime(10)',
  '29',

  'prime(100)',
  '541',

  // last entry of the table: the 10000th prime
  'prime(10000)',
  '104729',

  'isprime(prime(10000))',
  '1',

  'prime(10001)',
  'Stop: prime: Argument out of range.',

  'prime(0)',
  'Stop: prime: Argument out of range.',

  'prime(-1)',
  'Stop: prime: Argument out of range.',

  'prime(3/2)',
  'Stop: prime: Argument out of range.',

  'prime(1.5)',
  'Stop: prime: Argument out of range.',

  // symbolic argument stays unevaluated
  'prime(n)',
  'prime(n)',

  'n=5',
  '',

  'prime(n)',
  '11',

  'n=quote(n)',
  '',
]);
