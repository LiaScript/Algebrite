import { run_test } from '../test-harness';

run_test([
  'factor(0)',
  '0',

  'factor(1)',
  '1',

  'factor(2)',
  '2',

  'factor(3)',
  '3',

  'factor(4)',
  '2^2',

  'factor(5)',
  '5',

  'factor(6)',
  '2*3',

  'factor(7)',
  '7',

  'factor(8)',
  '2^3',

  'factor(9)',
  '3^2',

  'factor(10)',
  '2*5',

  'factor(100!)',
  '2^97*3^48*5^24*7^16*11^9*13^7*17^5*19^5*23^4*29^3*31^3*37^2*41^2*43^2*47^2*53*59*61*67*71*73*79*83*89*97',

  'factor(2*(2^30-35))',
  '2*1073741789',

  // x is the 10,000th prime

  // Prime factors greater than x^2 are found using the Pollard rho method

  'a=104729',
  '',

  'factor(2*(a^2+6))',
  '2*10968163447',

  'factor((a^2+6)^2)',
  '10968163447^2',

  'factor((a^2+6)*(a^2+60))',
  '10968163447*10968163501',

  'f=(x+1)*(x+2)*(y+3)*(y+4)',
  '',

  'factor(f,x,y)',
  '(x+1)*(x+2)*(y+3)*(y+4)',

  'factor(f,y,x)',
  '(x+1)*(x+2)*(y+3)*(y+4)',

  'f=(x+1)*(x+1)*(y+2)*(y+2)',
  '',

  'factor(f,x,y)',
  '(x+1)^2*(y+2)^2',

  'factor(f,y,x)',
  '(x+1)^2*(y+2)^2',

  'factor((x+1)*(-x^2+x+1),x)',
  '-(x^2-x-1)*(x+1)',

  'factor((x+1)*(x^2-x-1),x)',
  '(x^2-x-1)*(x+1)',

  'factor(5*x^3-5)',
  '5*(x-1)*(x^2+x+1)',

  'factor((x+1)*(2x+4))',
  '2*(x+1)*(x+2)',

  'factor(x^8 - 1)',
  '(x-1)*(x+1)*(x^2+1)*(x^4+1)',

  'factor((x-1)*(x+1)*(x^2+1)*(2*x^4+2))',
  '2*(x-1)*(x+1)*(x^2+1)*(x^4+1)',

  'factor((x-1)*(x+1)*(2*x^2+2)*(x^4+1))',
  '2*(x-1)*(x+1)*(x^2+1)*(x^4+1)',

  'factor(x^1 - 1)',
  'x-1',

  'factor(x^2 - 1)',
  '(x-1)*(x+1)',

  'factor(x^3 - 1)',
  '(x-1)*(x^2+x+1)',

  'factor(x^4 - 1)',
  '(x-1)*(x+1)*(x^2+1)',

  'factor(x^5 - 1)',
  '(x-1)*(x^4+x^3+x^2+x+1)',

  'factor(x^6 - 1)',
  '(x-1)*(x+1)*(x^2+x+1)*(x^2-x+1)',

  'factor(x^7 - 1)',
  '(x-1)*(x^6+x^5+x^4+x^3+x^2+x+1)',

  // irreducible in Z
  'factor(1+x+x^2+x^3+x^4)',
  'x^4+x^3+x^2+x+1',

  'factor(x^4 - 1*x^3 + 4*x^2 + 3*x + 5)',
  '(x^2+x+1)*(x^2-2*x+5)',

  // https://github.com/davidedc/Algebrite/issues/113
  "factor((x^3+x^2+x)*(y^3+y^2),x,y)",
  "x*y^2*(x^2+x+1)*(y+1)",

  // clean up
  'a = quote(a)',
  '',

  'f = quote(f)',
  '',

  // Every factorization below was checked with sympy: the product equals
  // the input and the factors are irreducible over Q.

  // integers and rationals
  'factor(-1)',
  '-1',

  'factor(-12)',
  '-2^2*3',

  'factor(-1001)',
  '-7*11*13',

  // Fermat number F5
  'factor(2^32+1)',
  '641*6700417',

  'factor(2^64+1)',
  '274177*67280421310721',

  // Mersenne prime
  'factor(2^61-1)',
  '2305843009213693951',

  // rationals are left alone
  'factor(1/12)',
  '1/12',

  'factor(-18/35)',
  '-18/35',

  // degree 1 and 2, repeated roots
  'factor(x^2+2*x+1)',
  '(x+1)^2',

  'factor(x^3-3*x^2+3*x-1)',
  '(x-1)^3',

  'factor(4*x^2-9)',
  '(2*x-3)*(2*x+3)',

  'factor(6*x^2+x-2)',
  '(2*x-1)*(3*x+2)',

  // irreducible over Q: irrational and complex roots
  'factor(x^2-2)',
  'x^2-2',

  'factor(x^2+1)',
  'x^2+1',

  'factor(x^6-2)',
  'x^6-2',

  // minimal polynomial of 2^(1/2)+3^(1/2)
  'factor(x^4-10*x^2+1)',
  'x^4-10*x^2+1',

  // rational and negative leading coefficients
  'factor(1/2*x^2-1/2)',
  '1/2*(x-1)*(x+1)',

  'factor(3/4*x^4+3/4)',
  '3/4*(x^4+1)',

  'factor(x^2/3+x/3)',
  '1/3*x*(x+1)',

  'factor(-x^2+1)',
  '-(x-1)*(x+1)',

  'factor(-2*x^2-4*x-2)',
  '-2*(x+1)^2',

  // the content of the last factor is pulled out after the sign
  'factor(-6*x^2-6)',
  '-6*(x^2+1)',

  'factor(-2/3*(x^2+x+1)^2)',
  '-2/3*(x^2+x+1)^2',

  'factor(-2*(x^2+2)*(x^2+3))',
  '-2*(x^2+2)*(x^2+3)',

  // irreducible quadratics, repeated and mixed with linear factors
  'factor((x^2+1)^2)',
  '(x^2+1)^2',

  'factor((x^2+x+1)^3)',
  '(x^2+x+1)^3',

  'factor((x-2)*(x+3)*(x^2+x+1)^2)',
  '(x-2)*(x^2+x+1)^2*(x+3)',

  'factor((x^2+2*x+10)^2*(x+1)^2)',
  '(x+1)^2*(x^2+2*x+10)^2',

  'factor((x^2+2*x+5)*(x^2-4*x+13))',
  '(x^2+2*x+5)*(x^2-4*x+13)',

  'factor((x^2+1)*(x^2+100))',
  '(x^2+1)*(x^2+100)',

  'factor(x^4+4)',
  '(x^2-2*x+2)*(x^2+2*x+2)',

  'factor(x^4+x^2+1)',
  '(x^2+x+1)*(x^2-x+1)',

  'factor(x^8+x^4+1)',
  '(x^2+x+1)*(x^2-x+1)*(x^4-x^2+1)',

  'factor(x^12-1)',
  '(x-1)*(x+1)*(x^2+x+1)*(x^2-x+1)*(x^4-x^2+1)*(x^2+1)',

  'factor(x^6+1)',
  '(x^4-x^2+1)*(x^2+1)',

  'factor(x^10+x^5+1)',
  '(x^2+x+1)*(x^8-x^7+x^5-x^4+x^3-x+1)',

  // quadratic factors without integer complex roots
  'factor(x^4+5*x^2+6)',
  '(x^2+2)*(x^2+3)',

  'factor(x^4-4)',
  '(x^2-2)*(x^2+2)',

  'factor(x^4-x^2-2)',
  '(x^2-2)*(x^2+1)',

  'factor(4*x^4+1)',
  '(2*x^2-2*x+1)*(2*x^2+2*x+1)',

  'factor((3*x^2+1)*(2*x^2+x+5))',
  '(3*x^2+1)*(2*x^2+x+5)',

  'factor(-(3*x^2+1)*(2*x^2+x+5)*(x-4))',
  '-(x-4)*(3*x^2+1)*(2*x^2+x+5)',

  'factor((5*x^2+2*x+1)^2)',
  '(5*x^2+2*x+1)^2',

  'factor((x^2-3)^2*(x^2+x+1))',
  '(x^2-3)^2*(x^2+x+1)',

  'factor((x^2+2)^2*(x-1)*(x^2+3))',
  '(x-1)*(x^2+2)^2*(x^2+3)',

  'factor((x^2+2)*(x^2+2*x+3)*(x^2-x+4))',
  '(x^2+2)*(x^2+2*x+3)*(x^2-x+4)',

  'factor((x^2+11)*(x^2+7*x+13))',
  '(x^2+11)*(x^2+7*x+13)',

  // factors of degree > 2 are split off as well (factor_zassenhaus.ts), the
  // old limitation left x^8+x^6+x^4+x^2+1 here
  'factor(x^10-1)',
  '(x-1)*(x+1)*(x^4+x^3+x^2+x+1)*(x^4-x^3+x^2-x+1)',

  // symbolic coefficients, multivariate
  'factor(a*x^2-a)',
  'a*(x-1)*(x+1)',

  'factor(x^2-y^2)',
  '(x+y)*(x-y)',

  'factor(x^3-y^3)',
  '(x-y)*(x^2+y^2+x*y)',

  'factor(x^2*y+x*y^2)',
  'x*y*(x+y)',

  // not a polynomial, or not in the given variable: unchanged
  'factor(sin(x))',
  'sin(x)',

  'factor(1/x)',
  '1/x',

  'factor(x^2+2*x+1,y)',
  'x^2+2*x+1',
]);
