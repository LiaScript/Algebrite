import { run_test } from '../test-harness';

// Polynomials in several variables with rational coefficients: what the
// search for factors linear or quadratic in the main variable leaves over is
// mapped to one variable (Kronecker substitution y -> x^D, z -> x^(D^2)),
// factored there, and every combination of the factors is mapped back and
// tried by division. Expected values checked with sympy.factor; every block
// multiplies out again.

run_test([
  'factor(x^2+2*x*y+y^2-z^2)',
  '(x+y+z)*(x+y-z)',

  'expand(last)-(x^2+2*x*y+y^2-z^2)',
  '0',
]);

run_test([
  'factor(x^3+y^3+z^3-3*x*y*z)',
  '(x+y+z)*(x^2+y^2+z^2-x*y-x*z-y*z)',

  'expand(last)-(x^3+y^3+z^3-3*x*y*z)',
  '0',
]);

run_test([
  'factor(a*c+a*d+b*c+b*d)',
  '(a+b)*(c+d)',

  'expand(last)-(a*c+a*d+b*c+b*d)',
  '0',
]);

run_test([
  'factor(x^2-y^2+2*y-1)',
  '(x+y-1)*(x-y+1)',

  'expand(last)-(x^2-y^2+2*y-1)',
  '0',
]);

run_test([
  'factor(x^2-y^2-z^2+2*y*z)',
  '(x+y-z)*(x-y+z)',

  'expand(last)-(x^2-y^2-z^2+2*y*z)',
  '0',
]);

run_test([
  // Sophie Germain
  'factor(x^4+4*y^4)',
  '(x^2+2*x*y+2*y^2)*(x^2-2*x*y+2*y^2)',

  'expand(last)-(x^4+4*y^4)',
  '0',
]);

run_test([
  'factor(x^4+x^2*y^2+y^4)',
  '(x^2+x*y+y^2)*(x^2-x*y+y^2)',

  'expand(last)-(x^4+x^2*y^2+y^4)',
  '0',
]);

run_test([
  // factors of degree 3 in x
  'factor((x^3+y*x+1)*(x^3+x^2+y))',
  '(x^3+x*y+1)*(x^3+x^2+y)',

  'expand(last)-((x^3+y*x+1)*(x^3+x^2+y))',
  '0',
]);

run_test([
  // a repeated factor
  'factor((x^2+y^2+1)^2)',
  '(x^2+y^2+1)^2',

  'factor((x*y+z)^2*(x+y*z))',
  '(x*y+z)^2*(x+y*z)',
]);

run_test([
  // numeric content
  'factor(2*x*y+2*x*z)',
  '2*x*(y+z)',

  'factor(6*x^2*y-6*y^3)',
  '6*y*(x+y)*(x-y)',

  'factor(x^2/2-y^2/2+y-1/2)',
  '1/2*(x+y-1)*(x-y+1)',
]);

run_test([
  // explicit main variable
  'factor(x^2+2*x*y+y^2-z^2,x)',
  '(x+y+z)*(x+y-z)',

  'factor(x^2+2*x*y+y^2-z^2,z)',
  '-(z+x+y)*(z-x-y)',

  'expand(last)-(x^2+2*x*y+y^2-z^2)',
  '0',
]);

// irreducible polynomials stay as they are
run_test([
  'factor(x^2+y^2)',
  'x^2+y^2',

  'factor(x^2+y^2+z^2)',
  'x^2+y^2+z^2',

  'factor(x^2+x*y+y^2)',
  'x^2+y^2+x*y',

  'factor(x^2-2*y^2)',
  'x^2-2*y^2',

  'factor(x*y+1)',
  '1+x*y',

  'factor(x^3+y^3+z^3)',
  'x^3+y^3+z^3',

  'factor(x^2*y^2+x+y+1)',
  '1+x+y+x^2*y^2',
]);

// regressions
run_test([
  'factor(x^2*y-y^3)',
  'y*(x+y)*(x-y)',

  'factor(x^4-y^4)',
  '(x+y)*(x-y)*(x^2+y^2)',

  'factor(x^2+3*x*y+2*y^2)',
  '(x+y)*(x+2*y)',

  'factor(x^2*y+x*y^2+x*z+y*z)',
  '(x+y)*(z+x*y)',

  'factor(x^3+x^2*y+x*y^2+y^3)',
  '(x+y)*(x^2+y^2)',

  // only the named variables are factored
  'factor((x+1)*(x+2)*(y+3)*(y+4),x)',
  '(x+1)*(x+2)*(y^2+7*y+12)',

  'factor((x+1)*(x+2)*(y+3)*(y+4),x,y)',
  '(x+1)*(x+2)*(y+3)*(y+4)',

  // a symbol that is not a polynomial variable: left alone
  'factor(x^2+2*x*sin(y)+sin(y)^2-z^2)',
  'x^2+sin(y)^2-z^2+2*x*sin(y)',

  'factor(x^2-y^(1/2)*x+z)',
  'x^2+z-x*y^(1/2)',
]);
