import { run_test } from '../test-harness';

// Integers: trial division by the first 10000 primes, then Pollard's rho in
// Brent's form (one gcd for 128 steps). Prime factors come out ascending and
// equal ones as a power. Every expected value is sympy.factorint's.

run_test([
  // two prime factors beyond the prime table
  'factor(2^67-1)',
  '193707721*761838257287',

  'factor(10^20+1)',
  '73*137*1676321*5964848081',

  'factor(10^22+1)',
  '89*101*1052788969*1056689261',

  'factor(25!+1)',
  '401*38681321803817920159601',

  // three of them
  'factor(1000000007*2000000011*3000000019)',
  '1000000007*2000000011*3000000019',

  // a square and a cube of a big prime: a power, not a repeated factor
  'factor((104729^2+6)^2)',
  '10968163447^2',

  'factor(1000003^3)',
  '1000003^3',

  'factor(2^10*(104729^2+6)^3)',
  '2^10*10968163447^3',

  // ascending order
  'factor((104729^2+6)*(104729^2+60))',
  '10968163447*10968163501',

  'factor(-(2^61-1)*3^4*1000003)',
  '-3^4*1000003*2305843009213693951',

  // primes stay
  'factor(2^89-1)',
  '618970019642690137449562111',

  'factor(2^61-1)',
  '2305843009213693951',

  'factor(10968163447)',
  '10968163447',

  // multiplying out gives the number back
  'eval(factor(2^67-1))-(2^67-1)',
  '0',

  // rationals are not factored (unchanged)
  'factor(12/35)',
  '12/35',
]);

// speed: 12 and 13 digit factors took 11 s and 29 s with a gcd in every step
run_test([
  'timelimit=8',
  '',

  'factor(100000000003*300000000077)',
  '100000000003*300000000077',

  'factor(1000000000039*7000000000009)',
  '1000000000039*7000000000009',

  // still out of reach: the smallest factor has 17 digits
  'timelimit=0.5',
  '',

  'factor(2^128+1)',
  'Stop: time limit of 0.5 s exceeded, see timelimit',
]);

// small numbers and the prime table (regressions)
run_test([
  'factor(0)',
  '0',

  'factor(1)',
  '1',

  'factor(-1)',
  '-1',

  'factor(-12)',
  '-2^2*3',

  'factor(1001)',
  '7*11*13',

  'factor(2^64+1)',
  '274177*67280421310721',

  'factor(104729^2)',
  '104729^2',

  'factor(104723*104729)',
  '104723*104729',

  'factor(30!)',
  '2^26*3^14*5^7*7^4*11^2*13^2*17*19*23*29',

  // a Carmichael number
  'factor(561)',
  '3*11*17',

  'factor(2*(2^30-35))',
  '2*1073741789',
]);
