import { run_test } from '../test-harness';

run_test([
  'binomial(12,6)',
  '924',

  'binomial(n,k)',
  //  "1/(factorial(k))*factorial(n)*1/(factorial(-k+n))",
  //  "factorial(n)/(factorial(k)*factorial(-k+n))",
  'n!/(k!*(-k+n)!)',

  'binomial(0,k)',
  //  "1/(factorial(k))*1/(factorial(-k))",
  //  "1/(factorial(k)*factorial(-k))",
  '1/(k!*(-k)!)',

  'binomial(n,0)',
  '1',

  // n! has a pole at n = -1, so this stays unevaluated
  // (it is (-1)^k for integer k >= 0, not 0)
  'binomial(-1,k)',
  'binomial(-1,k)',

  'binomial(n,-1)',
  '0',

  'binomial(5,2)',
  '10',

  'binomial(5,5)',
  '1',

  'binomial(0,0)',
  '1',

  // k > n vanishes
  'binomial(5,6)',
  '0',

  'binomial(5,-2)',
  '0',

  'binomial(100,50)',
  '100891344545564193334812497256',

  'binomial(200,100)',
  '90548514656103281165404177077484163874504589675413336841320',

  // Pascal rule
  'binomial(20,10)+binomial(20,11)-binomial(21,11)',
  '0',

  // generalized binomial coefficient: n (n-1) ... (n-k+1) / k!
  'binomial(-1,5)',
  '-1',

  'binomial(-3,2)',
  '6',

  'binomial(1/2,2)',
  '-1/8',

  'binomial(-1/2,3)',
  '-5/16',

  'binomial(2.5,2)',
  '1.875',

  'binomial(5.0,2)',
  '10.0',

  'binomial(n,n)',
  '1',

  'simplify(binomial(n,2))',
  '1/2*n*(-1+n)',

  // non-integer k: Gamma function form
  'binomial(5,1/2)',
  '120/((1/2)!*(9/2)!)',
]);
