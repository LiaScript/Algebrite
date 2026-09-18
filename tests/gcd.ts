import { run_test } from '../test-harness';

const gcdTests = [];

const GCD_TESTS_DONT_TEST_FACTOR = 1;

function addGcdTest(arg1, arg2, result, dontTestFactor?: any) {
  gcdTests.push('gcd(' + arg1 + ',' + arg2 + ')');
  gcdTests.push(result);

  gcdTests.push('gcd(' + arg2 + ',' + arg1 + ')');
  gcdTests.push(result);

  if (dontTestFactor == null) {
    gcdTests.push('gcd(factor(' + arg1 + '),' + arg2 + ')');
    gcdTests.push(result);
  }

  if (dontTestFactor == null) {
    gcdTests.push('gcd(factor(' + arg2 + '),' + arg1 + ')');
    gcdTests.push(result);
  }

  if (dontTestFactor == null) {
    gcdTests.push('gcd(' + arg1 + ',factor(' + arg2 + '))');
    gcdTests.push(result);
  }

  if (dontTestFactor == null) {
    gcdTests.push('gcd(' + arg2 + ',factor(' + arg1 + '))');
    gcdTests.push(result);
  }

  if (dontTestFactor == null) {
    gcdTests.push('gcd(factor(' + arg1 + '),factor(' + arg2 + '))');
    gcdTests.push(result);
  }

  if (dontTestFactor == null) {
    gcdTests.push('gcd(factor(' + arg2 + '),factor(' + arg1 + '))');
    return gcdTests.push(result);
  }
}

addGcdTest('30', '42', '6');
addGcdTest('-30', '42', '6');
addGcdTest('30', '-42', '6');
addGcdTest('-30', '-42', '6', GCD_TESTS_DONT_TEST_FACTOR);

addGcdTest('x', 'x', 'x');
addGcdTest('-x', 'x', 'x');
addGcdTest('-x', '-x', '-x');

addGcdTest('x^2', 'x^3', 'x^2');
addGcdTest('x', 'y', '1');
addGcdTest('x*y', 'y', 'y');
addGcdTest('x*y', 'y^2', 'y');
addGcdTest('x^2*y^2', 'x^3*y^3', 'x^2*y^2');
addGcdTest('x^2', 'x^3', 'x^2');

// gcd of expr
addGcdTest('x+y', 'x+z', '1');
addGcdTest('x+y', 'x+y', 'x+y');
addGcdTest('x+y', '2*x+2*y', 'x+y', GCD_TESTS_DONT_TEST_FACTOR);
addGcdTest('-x-y', 'x+y', 'x+y', GCD_TESTS_DONT_TEST_FACTOR);
addGcdTest('4*x+4*y', '6*x+6*y', '2*x+2*y', GCD_TESTS_DONT_TEST_FACTOR);
addGcdTest('4*x+4*y+4', '6*x+6*y+6', '2+2*x+2*y', GCD_TESTS_DONT_TEST_FACTOR);
// 2*(2*x+2*y+2) and 2*(3*x+3*y+6): the contents have gcd 2
addGcdTest('4*x+4*y+4', '6*x+6*y+12', '2', GCD_TESTS_DONT_TEST_FACTOR);
addGcdTest('27*t^3+y^3+9*t*y^2+27*t^2*y', 't+y', '1');

// gcd expr factor
addGcdTest('2*a^2*x^2+a*x+a*b', 'a', 'a');
addGcdTest('2*a^2*x^2+a*x+a*b', 'a^2', 'a');
addGcdTest('2*a^2*x^2+2*a*x+2*a*b', 'a', 'a');

// gcd expr term
addGcdTest('2*a^2*x^2+2*a*x+2*a*b', '2*a', '2*a');
addGcdTest('2*a^2*x^2+2*a*x+2*a*b', '3*a', 'a');
addGcdTest('2*a^2*x^2+2*a*x+2*a*b', '4*a', '2*a');

// gcd factor factor
addGcdTest('x', 'x^2', 'x');
addGcdTest('x', 'x^a', '1');
run_test(gcdTests);

// multiple arguments
run_test(['gcd(12,18,9)', '3']);

run_test([
  // zero: every expression divides 0
  'gcd(0,5)',
  '5',

  'gcd(0,0)',
  '0',

  'gcd(0,x)',
  'x',

  'gcd(x^2-1,0)',
  'x^2-1',

  'gcd(-4,-6)',
  '2',

  // rationals: the largest r such that both are integer multiples of r
  'gcd(1/2,1/3)',
  '1/6',

  // 2/3 = 3*(2/9), 4/9 = 2*(2/9)
  'gcd(2/3,4/9)',
  '2/9',

  'gcd(3,1/2)',
  '1/2',

  // univariate: Euclid, any variable name
  'gcd(t^2-1,t+1)',
  't+1',

  // x^4-4 = (x^2-2)*(x^2+2), irrational roots
  'gcd(x^2-2,x^4-4)',
  'x^2-2',

  // 6*x^2+x-2 = (2*x-1)*(3*x+2), 4*x^2-1 = (2*x-1)*(2*x+1)
  'gcd(6*x^2+x-2,4*x^2-1)',
  '2*x-1',

  'gcd(x^2+1,x+1)',
  '1',

  'gcd(2*x^2-2,4*x+4)',
  '2*x+2',

  // x^4-1 = (x-1)*(x+1)*(x^2+1), x^6-1 = (x-1)*(x+1)*(x^2+x+1)*(x^2-x+1)
  'gcd(x^4-1,x^6-1)',
  'x^2-1',

  'gcd(x^3+1,x^2+2*x+1)',
  'x+1',

  'gcd(x^2+x+1,x^3-1)',
  'x^2+x+1',

  // content 1/2 and 1
  'gcd(1/2*x^2-1/2,x+1)',
  '1/2*x+1/2',

  // multivariate
  'gcd(x^2-y^2,x+y)',
  'x+y',

  'gcd(x^2-y^2,x-y)',
  'x-y',

  'gcd(x^2-y^2,x^2+2*x*y+y^2)',
  'x+y',

  'gcd(x^2-a^2,x+a)',
  'x+a',

  'gcd(2*x+2,4*y+4*z+6)',
  '2',

  'gcd(x*y+x,y+1)',
  'y+1',

  // a sum against a power of it
  'gcd(x+y,(x+y)^2)',
  'x+y',

  'gcd(x^2+2*x*y+y^2,(x+y)^3)',
  'x^2+y^2+2*x*y',
]);

// rationalize multiplies each term by the common denominator: it must be
// built from the terms' own denominator factors, the true lcm 4*x^2+4 of
// x^2+1 and 4*x^2+4 would not cancel 1/(x^2+1)
run_test([
  'rationalize(a/(2*(x^2+1))-2*a/(4*x^2+4))',
  '0',

  'simplify(a/(2*(x^2+1))-2*a/(4*x^2+4))',
  '0',

  'rationalize(1/(x+1)+1/(x^2-1))',
  'x/(x^2-1)',
]);

