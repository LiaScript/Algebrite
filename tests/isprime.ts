import { run_test } from '../test-harness';

run_test([
  // 0 and 1 are not prime numbers

  'isprime(0)',
  '0',

  'isprime(1)',
  '0',

  'isprime(13)',
  '1',

  'isprime(14)',
  '0',

  // from the Prime Curios web page

  'isprime(9007199254740991)',
  '0',

  // The largest prime that JavaScript supports

  'isprime(2^53 - 111)',
  '1',

  // misc. primes

  'isprime(2^50-71)',
  '1',

  'isprime(2^40-87)',
  '1',

  'isprime(2)',
  '1',

  'isprime(4)',
  '0',

  // primes are positive here
  'isprime(-7)',
  '0',

  'isprime(3/2)',
  '0',

  // Carmichael number, fools the Fermat test
  'isprime(561)',
  '0',

  'isprime(prime(10000))',
  '1',

  // Fermat number F5 = 641*6700417
  'isprime(2^32+1)',
  '0',

  // Mersenne primes beyond 2^53
  'isprime(2^61-1)',
  '1',

  'isprime(2^89-1)',
  '1',

  // 2^67-1 = 193707721*761838257287 (Cole)
  'isprime(2^67-1)',
  '0',

  'isprime(10^20+39)',
  '1',
]);
