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
  '(-1+x+y)*(1+x-y)',

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
  '(x^2+2*y^2-2*x*y)*(x^2+2*y^2+2*x*y)',

  'expand(last)-(x^4+4*y^4)',
  '0',
]);

run_test([
  'factor(x^4+x^2*y^2+y^4)',
  '(x^2+y^2-x*y)*(x^2+y^2+x*y)',

  'expand(last)-(x^4+x^2*y^2+y^4)',
  '0',
]);

run_test([
  // factors of degree 3 in x
  'factor((x^3+y*x+1)*(x^3+x^2+y))',
  '(1+x^3+x*y)*(y+x^2+x^3)',

  'expand(last)-((x^3+y*x+1)*(x^3+x^2+y))',
  '0',
]);

run_test([
  // a repeated factor
  'factor((x^2+y^2+1)^2)',
  '(1+x^2+y^2)^2',

  'factor((x*y+z)^2*(x+y*z))',
  '(x+y*z)*(z+x*y)^2',
]);

run_test([
  // numeric content
  'factor(6*x^2*y-6*y^3)',
  '6*y*(x+y)*(x-y)',

  'factor(x^2/2-y^2/2+y-1/2)',
  '1/2*(-1+x+y)*(1+x-y)',
]);

run_test([
  // explicit main variable
  'factor(x^2+2*x*y+y^2-z^2,x)',
  '(x+y+z)*(x+y-z)',

  'factor(x^2+2*x*y+y^2-z^2,z)',
  '-(x+y+z)*(-x-y+z)',

  'expand(last)-(x^2+2*x*y+y^2-z^2)',
  '0',
]);

// no variable given and none of x, y, z, t, s in the polynomial: the first
// symbol of the polynomial is the main variable (before: nothing happened)
run_test([
  'factor(a^2-1)',
  '(-1+a)*(1+a)',

  'factor(a^2-b^2)',
  '(a+b)*(a-b)',

  'factor(n^2+3*n+2)',
  '(1+n)*(2+n)',

  'factor(a^3-b^3)',
  '(a-b)*(a*b+a^2+b^2)',

  'expand(last)-(a^3-b^3)',
  '0',

  'factor(p^4+4*q^4)',
  '(-2*p*q+p^2+2*q^2)*(2*p*q+p^2+2*q^2)',

  'expand(last)-(p^4+4*q^4)',
  '0',

  // x is preferred when it is there
  'factor(a*x^2-a)',
  'a*(x-1)*(x+1)',

  // numbers stay numbers
  'factor(12)',
  '2^2*3',
]);

run_test([
  // the number comes out of 2*y+2*z. bake, the display step for polynomials
  // in x, multiplies it back in, so it shows with bake=0 only
  'bake=0',
  '',

  'factor(2*x*y+2*x*z)',
  '2*x*(y+z)',

  'factor(3*x*y^2+3*x*z)',
  '3*x*(z+y^2)',

  'bake=1',
  '',
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
  'x^2-z^2+sin(y)^2+2*sin(y)*x',

  'factor(x^2-y^(1/2)*x+z)',
  'z+x^2-y^(1/2)*x',
]);

// factor(p) without a variable is complete: what the main variable leaves
// over, and the factors found first, are factored in the other symbols too
// (sympy.factor for the expected values). factor(p, x) still factors in x
// only.
run_test([
  'factor(36*y^2*z-120*y*z+100*z)',
  '4*z*(3*y-5)^2',

  'factor(x^2*z+2*x*z+z)',
  'z*(x+1)^2',

  'factor(x*y^2-x)',
  'x*(y-1)*(y+1)',

  'factor(8*x*y^2*z+16*y*z)',
  '8*y*z*(x*y+2)',

  'factor(-108*b^3*z-27*b^3-864*b^2*z-216*b^2-2304*b*z-576*b-2048*z-512)',
  '-(3*b+8)^3*(4*z+1)',

  'factor(10*w^2*x*z+15*w*x^2*z^2+10*w*x*z^2+15*x^2*z^3)',
  '5*x*z*(w+z)*(2*w+3*x*z)',

  'factor((x+1)*(x+2)*(y+3)*(y+4))',
  '(x+1)*(x+2)*(y+3)*(y+4)',

  // with the variable named, only that one
  'factor((x+1)*(x+2)*(y+3)*(y+4),x)',
  '(x+1)*(x+2)*(y^2+7*y+12)',
]);
