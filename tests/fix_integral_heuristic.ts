import { run_test } from '../test-harness';

// Defects found by differential testing against sympy/mpmath.
//
// ok3(F,p,q,r) is the check of tests/integral_gaps.ts: the derivative of
// integral(F,x) equals F at x = p, q, r and the antiderivative is real there
// (imaginary part < 10^-12). Here it is a pair of statements, so that the
// integral is computed once (a function argument is evaluated at every use). The points are taken on EVERY real branch of
// the integrand, left and right of the roots of the radicand, so that a
// missing abs in a log shows up. The explicit antiderivatives and the defint
// values were checked with python mpmath (30 digits, diff and quad).
const helpers = [
  'okat(G,F,p)=and(abs(float(eval(d(G,x)-F,x,p)))<10^(-9),abs(imag(float(eval(G,x,p))))<10^(-12))',
  '',
  'all3(G,F,p,q,r)=and(okat(G,F,p),okat(G,F,q),okat(G,F,r))',
  '',
  'near(u,v)=abs(float(u)-v)<10^(-9)',
  '',
];

const ok3 = (F: string, p: string, q: string, r: string) => [
  `G=integral(${F},x)`,
  '',
  `all3(G,${F},${p},${q},${r})`,
  '1',
];

// 0. The root cause of the stack overflow: gcd multiplied the gcds of all
// pairs of factors and took gcd(3,3^(1/2)) = 3^(1/2), so that
// gcd(3*3^(1/2)*z,3*3^(1/2)*a) was 3*3^(1/2)*3^(1/2)*3^(1/2) = 9*3^(1/2).
// condense then divided by too much and left a fraction inside the sum,
// rationalize took the fraction out again, and numerator/denominator went
// back and forth between the two forms until the stack was full.
run_test([
  'gcd(3*3^(1/2)*z,3*3^(1/2)*a)',
  '3*3^(1/2)',

  'gcd(3*3^(1/2)*z,3*a)',
  '3',

  'gcd(2*2^(1/3)*z,4*a)',
  '2',

  // a symbol and its root do combine: x = x^(1/2)*x^(1/2)
  'gcd(x,x^(1/2))',
  'x^(1/2)',

  'gcd(x^2*y,x^(1/2)*z)',
  'x^(1/2)',

  'gcd(3^(1/2)*a,3^(1/2)*b)',
  '3^(1/2)',

  // nothing to take out: 3 does not divide 2*3^(1/2) without a fraction
  'condense(51*a+9*3^(1/2)*x*z-3*3^(1/2)*z+2*3^(1/2)*z^3)',
  '51*a+9*3^(1/2)*x*z-3*3^(1/2)*z+2*3^(1/2)*z^3',

  'condense(3*3^(1/2)*z+3*3^(1/2)*a)',
  '3*3^(1/2)*(z+a)',

  'numerator(51*a+9*3^(1/2)*x*z-3*3^(1/2)*z+2*3^(1/2)*z^3)',
  '51*a+9*3^(1/2)*x*z-3*3^(1/2)*z+2*3^(1/2)*z^3',

  'denominator(51*a+9*3^(1/2)*x*z-3*3^(1/2)*z+2*3^(1/2)*z^3)',
  '1',

  'denominator(17*a+3*3^(1/2)*x*z-3^(1/2)*z+2/3*3^(1/2)*z^3)',
  '3',

  'numerator(17*a+3*3^(1/2)*x*z-3^(1/2)*z+2/3*3^(1/2)*z^3)',
  '51*a+9*3^(1/2)*x*z-3*3^(1/2)*z+2*3^(1/2)*z^3',

  // neighbours that were right
  'denominator(x/2+y/3)',
  '6',

  'numerator(x/2+y/3)',
  '3*x+2*y',

  'denominator(1/x+3^(1/2)/y)',
  'x*y',

  'condense(6*a+4*3^(1/2)*b)',
  '2*(3*a+2*3^(1/2)*b)',
]);

// 1. (p*x+q)*sqrt(a*x^2+b*x+c) with a not 1: "Maximum call stack size
// exceeded". With u = x+b/(2*a) these are u*sqrt(a*u^2+k) and sqrt(a*u^2+k).
// The radicands here have no real root, so every x is in the domain.
run_test([
  ...helpers,

  ...ok3('(3*x+2)*sqrt(3*x^2-2*x+6)', '-2', '0', '3'),

  // mpmath.quad
  'near(defint((3*x+2)*sqrt(3*x^2-2*x+6),x,0,2),29.3454162007982481)',
  '1',

  ...ok3('(3*x+2)*sqrt(3*x^2-2*x+1)', '-2', '0', '3'),

  ...ok3('(3*x+2)*sqrt(3*x^2+x+1)', '-2', '0', '3'),

  ...ok3('(3*x+2)*sqrt(3*x^2+x+6)', '-2', '0', '3'),

  // the expanded form
  ...ok3('3*x*sqrt(3*x^2-2*x+6)+2*sqrt(3*x^2-2*x+6)', '-2', '0', '3'),

  // these worked before
  ...ok3('(x+1)*sqrt(3*x^2-2*x+6)', '-2', '0', '3'),

  ...ok3('(3*x+2)*sqrt(2*x^2-2*x+6)', '-2', '0', '3'),
]);

// other leading coefficients, linear factors and shapes
run_test([
  ...helpers,

  ...ok3('(2*x-1)*sqrt(2*x^2+3*x+4)', '-2', '0', '3'),

  ...ok3('(5*x+3)*sqrt(5*x^2-x+2)', '-2', '0', '3'),

  ...ok3('(x-2)*sqrt(1/2*x^2+x+3)', '-2', '0', '3'),

  ...ok3('(-3*x+1)*sqrt(3*x^2-2*x+6)', '-2', '0', '3'),

  ...ok3('x*sqrt(3*x^2-2*x+6)', '-2', '0', '3'),

  ...ok3('sqrt(3*x^2-2*x+6)', '-2', '0', '3'),

  ...ok3('1/sqrt(3*x^2-2*x+6)', '-2', '0', '3'),

  ...ok3('x/sqrt(3*x^2-2*x+6)', '-2', '0', '3'),

  ...ok3('x^2/sqrt(3*x^2-2*x+6)', '-2', '0', '3'),

  ...ok3('(3*x+2)/sqrt(3*x^2-2*x+6)', '-2', '0', '3'),
]);

// a < 0: 6-2*x-3*x^2 is positive between (-1-sqrt(19))/3 = -1.79 and 1.12
run_test([
  ...helpers,

  ...ok3('(3*x+2)*sqrt(6-2*x-3*x^2)', '-1', '0', '1/2'),

  ...ok3('sqrt(6-2*x-3*x^2)', '-1', '0', '1/2'),

  ...ok3('1/sqrt(6-2*x-3*x^2)', '-1', '0', '1/2'),

  ...ok3('x/sqrt(6-2*x-3*x^2)', '-1', '0', '1/2'),

  ...ok3('x^2/sqrt(6-2*x-3*x^2)', '-1', '0', '1/2'),

  // another variable name
  'integral(1/sqrt(y^2-4*y-6),y)',
  'log(abs(2-y-(y^2-4*y-6)^(1/2)))',

  'G=integral((3*t+2)*sqrt(3*t^2-2*t+6),t)',
  '',

  'abs(float(eval(d(G,t)-(3*t+2)*sqrt(3*t^2-2*t+6),t,2)))<10^(-9)',
  '1',
]);

// 1b. slow and then "could not find a solution"
run_test([
  ...helpers,

  // roots of 3*x^2-x: 0 and 1/3
  ...ok3('x^2/sqrt(3*x^2-x)', '-3', '-1', '-1/2'),

  ...ok3('x^2/sqrt(3*x^2-x)', '1', '2', '5'),

  ...ok3('x^2/sqrt(3*x^2-2*x)', '-3', '-1', '-1/2'),
]);

run_test([
  ...helpers,

  // pole at 6^(-1/3) = 0.55
  ...ok3('x^4/(6*x^3-1)', '-2', '0', '2'),

  ...ok3('x/(6*x^3-1)', '-2', '0', '2'),
]);

// 2. A log of (linear + sqrt(quadratic)) had no abs when the quadratic has
// real roots: on the left branch the argument is negative and the
// antiderivative was complex (constant imaginary part pi), although
// d/dx log|u+sqrt(u^2-c)| = 1/sqrt(u^2-c) holds on both branches.
run_test([
  ...helpers,

  // roots 2-sqrt(10) = -1.16 and 2+sqrt(10) = 5.16; abs() prints the
  // argument with the other sign
  'integral(1/sqrt(x^2-4*x-6),x)',
  'log(abs(2-x-(x^2-4*x-6)^(1/2)))',

  ...ok3('1/sqrt(x^2-4*x-6)', '-5', '-3', '-2'),

  ...ok3('1/sqrt(x^2-4*x-6)', '6', '8', '10'),

  // mpmath.quad
  'near(defint(1/sqrt(x^2-4*x-6),x,-5,-2),0.719618953570393736)',
  '1',

  // roots 0 and 2/5. abs() takes the content 1/5 out of the argument; the
  // log(5) it leaves is a constant of integration and is dropped
  'integral(1/sqrt(5*x^2-2*x),x)',
  'log(abs(5^(1/2)-5*(5*x^2-2*x)^(1/2)-5*5^(1/2)*x))/(5^(1/2))',

  ...ok3('1/sqrt(5*x^2-2*x)', '-3', '-1', '-1/2'),

  ...ok3('1/sqrt(5*x^2-2*x)', '1', '2', '5'),

  // roots (5-sqrt(41))/2 = -0.70 and 5.70
  ...ok3('x^2/sqrt(x^2-5*x-4)', '-4', '-2', '-1'),

  ...ok3('x^2/sqrt(x^2-5*x-4)', '6', '8', '10'),

  // roots -3/2 and -1
  ...ok3('sqrt(2*x^2+5*x+3)', '-4', '-3', '-2'),

  ...ok3('sqrt(2*x^2+5*x+3)', '0', '1', '3'),

  'near(defint(sqrt(2*x^2+5*x+3),x,-4,-2),4.89174078314042808)',
  '1',

  ...ok3('x*sqrt(x^2-4*x-6)', '-5', '-3', '-2'),

  ...ok3('(2*x-3)/sqrt(x^2-4*x-6)', '-5', '-3', '-2'),

  ...ok3('1/sqrt(x^2-3*x+1)', '-3', '-1', '0'),
]);

// symbolic coefficients
run_test([
  ...helpers,

  'assume(a,positive)',
  '',

  // roots -a and 0
  'integral(1/sqrt(x^2+a*x),x)',
  'log(abs(1/2*a+x+(x^2+a*x)^(1/2)))',

  'all3(eval(integral(1/sqrt(x^2+a*x),x),a,2),1/sqrt(x^2+2*x),-5,-3,1)',
  '1',

  // no assumption on b: still real where the integrand is real
  'all3(eval(integral(1/sqrt(x^2+b*x),x),b,-3),1/sqrt(x^2-3*x),-5,-1,4)',
  '1',

  'all3(eval(integral(1/sqrt(x^2+2*x+b),x),b,-3),1/sqrt(x^2+2*x-3),-5,-4,2)',
  '1',
]);

// what was right stays as it is
run_test([
  'integral(1/sqrt(x^2+2*x+5),x)',
  'log(abs(1+x+(x^2+2*x+5)^(1/2)))',

  'integral(1/sqrt(3-2*x-x^2),x)',
  'arcsin(1/2*x+1/2)',

  'integral(x/sqrt(3-2*x-x^2),x)',
  '-arcsin(1/2*x+1/2)-(-x^2-2*x+3)^(1/2)',

  'integral(1/(x^2+2*x+5)^(3/2),x)',
  '1/(4*(x^2+2*x+5)^(1/2))+x/(4*(x^2+2*x+5)^(1/2))',

  // x*log(x): the log is not a term of its own and can't change
  'integral(log(x),x)',
  '-x+x*log(x)',

  'integral(1/(x^2+2*x+5),x)',
  '1/2*arctan(1/2*x+1/2)',
]);

// 3. 1/sqrt(tan(x)): with u = sqrt(tan(x)) the integrand is 2/(1+u^4); a
// positive constant factor inside the root comes out of it.
// tan(x) > 0 on (0,pi/2) and on (-pi,-pi/2).
run_test([
  ...helpers,

  'integral(1/sqrt(tan(x)),x)',
  'arctan(-1+2^(1/2)*tan(x)^(1/2))/(2^(1/2))+arctan(1+2^(1/2)*tan(x)^(1/2))/(2^(1/2))-log(1+tan(x)-2^(1/2)*tan(x)^(1/2))/(2*2^(1/2))+log(1+tan(x)+2^(1/2)*tan(x)^(1/2))/(2*2^(1/2))',

  ...ok3('1/sqrt(tan(x))', '1/2', '1', '3/2'),

  ...ok3('1/sqrt(tan(x))', '-3', '-5/2', '-2'),

  // mpmath.quad
  'near(defint(1/sqrt(tan(x)),x,1/2,1),0.524603001503764189)',
  '1',

  ...ok3('sqrt(2*tan(x))', '1/2', '1', '3/2'),

  ...ok3('sqrt(2*tan(x))', '-3', '-5/2', '-2'),

  'near(defint(sqrt(2*tan(x)),x,1/2,1),0.688949065789883628)',
  '1',

  ...ok3('1/sqrt(3*tan(x))', '1/2', '1', '3/2'),

  'near(defint(1/sqrt(3*tan(x)),x,1/2,1),0.302879684135883904)',
  '1',

  ...ok3('sqrt(tan(x)/2)', '1/2', '1', '3/2'),

  ...ok3('1/sqrt(tan(2*x+1))', '0', '-1/5', '-2'),

  ...ok3('5/sqrt(tan(x))', '1/2', '1', '3/2'),

  // the logs cancel
  'integral(sqrt(tan(x))+1/sqrt(tan(x)),x)',
  '2^(1/2)*arctan(-1+2^(1/2)*tan(x)^(1/2))+2^(1/2)*arctan(1+2^(1/2)*tan(x)^(1/2))',

  // a negative factor stays inside the root
  'integral(1/sqrt(-2*tan(x)),x)',
  'Stop: integral: sorry, could not find a solution',

  // unchanged
  'integral(sqrt(tan(x)),x)',
  'arctan(-1+2^(1/2)*tan(x)^(1/2))/(2^(1/2))+arctan(1+2^(1/2)*tan(x)^(1/2))/(2^(1/2))+log(1+tan(x)-2^(1/2)*tan(x)^(1/2))/(2*2^(1/2))-log(1+tan(x)+2^(1/2)*tan(x)^(1/2))/(2*2^(1/2))',

  // a factor of unknown sign does not come out of the root
  'integral(sqrt(a*tan(x)),x)',
  'Stop: integral: sorry, could not find a solution',

  // with a > 0 it does
  'assume(a,positive)',
  '',

  'all3(eval(integral(sqrt(a*tan(x)),x),a,2),sqrt(2*tan(x)),1/2,1,3/2)',
  '1',
]);

// The same gap in results that come straight from the table: a radicand
// without a linear term. x+sqrt(x^2-4) is negative for x < -2, and
// log(abs(...)) is the real antiderivative on both branches:
// d/dx log|x+sqrt(x^2-4)| = 1/sqrt(x^2-4) at x = -3 and at x = 3 (0.447214).
run_test([
  'integral(1/sqrt(x^2-4),x)',
  'log(abs(x+(x^2-4)^(1/2)))',

  // real and with the right slope on the left branch
  'G=integral(1/sqrt(x^2-4),x)',
  '',

  'abs(imag(float(eval(G,x,-3))))<10^(-12)',
  '1',

  'abs(float(eval(d(G,x),x,-3))-1/sqrt(5))<10^(-9)',
  '1',

  'abs(float(eval(d(G,x),x,3))-1/sqrt(5))<10^(-9)',
  '1',

  // the integral over the left branch: log((3+sqrt(5))/(4+sqrt(12))) < 0
  // reversed, mpmath.quad gives 0.354534
  'abs(float(defint(1/sqrt(x^2-4),x,-4,-3))-0.354534)<10^(-5)',
  '1',

  'G=integral((2*x-3)*sqrt(x^2-1),x)',
  '',

  'abs(imag(float(eval(G,x,-2))))<10^(-12)',
  '1',

  'abs(float(eval(d(G,x)-(2*x-3)*sqrt(x^2-1),x,-2)))<10^(-9)',
  '1',

  'G=integral(x^2/sqrt(5*x^2-3),x)',
  '',

  'abs(imag(float(eval(G,x,-2))))<10^(-12)',
  '1',

  'abs(float(eval(d(G,x)-x^2/sqrt(5*x^2-3),x,-2)))<10^(-9)',
  '1',

  // a positive radicand: the argument is positive, the abs that every
  // provably real log argument gets does no harm
  'integral(1/sqrt(x^2+4),x)',
  'log(abs(x+(x^2+4)^(1/2)))',
]);
