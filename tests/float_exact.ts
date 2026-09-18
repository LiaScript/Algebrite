import { run_test } from '../test-harness';

// float(x) evaluates x exactly first and converts the result: the exact
// algorithms (gcd, roots, tables, primality) cannot work on float input.
run_test([
  // gcd(x^2-1,x+1) = x+1, not 1
  'float(gcd(x^2-1,x+1))',
  'x+1.0',

  'float(isprime(7))',
  '1.0',

  'float(prime(10))',
  '29.0',

  'float(taylor(sin(x)/x,x,2,0))',
  '1.0-0.166667...*x^2.0',

  'float(limit(sin(x)/x,x,0))',
  '1.0',

  'float(limit((x^2-1)/(x-1),x,1))',
  '2.0',

  // (5 -+ sqrt(33))/2
  'float(eigenvalues([[1,2],[3,4]]))',
  '[-0.372281...,5.372281...]',

  'float(eigenvalues([[2,1],[1,2]]))',
  '[1.0,3.0]',

  // (x^2-1 at x = 2) = 3
  'float(resultant(x^2-1,x-2,x))',
  '3.0',

  'float(nroots(x^2-2))',
  '[-1.414214...,1.414214...]',

  'float(simplify(sin(x)^2+cos(x)^2))',
  '1.0',

  'float(apart(1/(x^2-1),x))',
  '0.5/(x-1.0)-0.5/(x+1.0)',

  // unchanged
  'float(pi)',
  '3.141593...',

  'float(1/3+sin(1))',
  '1.174804...',

  'float(erf(1))',
  '0.842701...',

  'float(defint(x^2,x,0,1))',
  '0.333333...',

  'float(x+1/2)',
  'x+0.5',

  // zeta at negative arguments: zeta(-20) = 0, zeta(-1) = -1/12,
  // zeta(-1/2) = -0.2078862249...
  'float(zeta(-20))',
  '0.0',

  'float(zeta(-1))',
  '-0.083333...',

  'float(zeta(-1/2))',
  '-0.207886...',

  'float(zeta(3))',
  '1.202057...',

  'zeta(-20.0)',
  '0.0',
]);
