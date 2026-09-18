import { run_test } from '../test-harness';

// Every value was checked with sympy.limit and numerically (mpmath, at
// distances 1e-3, 1e-5, 1e-7 from the point on each side, or at 1.37e3,
// 1.37e5, 1.37e7 for a limit at infinity).

// ---------------------------------------------------------------------------
// 1. A function value at a pole must not stay a harmless symbolic
//    expression that 0*u absorbs: tan(pi/2), gamma(0), digamma(0) stop like
//    1/0, sec(pi/2), cot(0) and gamma(-1) always did.
// ---------------------------------------------------------------------------
run_test([
  'tan(pi/2)',
  'Stop: divide by zero',

  'tan(3*pi/2)',
  'Stop: divide by zero',

  'tan(-pi/2)',
  'Stop: divide by zero',

  'tan(5/2*pi)',
  'Stop: divide by zero',

  // was 0
  '0*tan(pi/2)',
  'Stop: divide by zero',

  // was 0, the function is sin(x) beside the point: 1
  'eval(tan(x)*cos(x),x,pi/2)',
  'Stop: divide by zero',

  // was 1.63...*10^16
  'float(tan(pi/2))',
  'Stop: divide by zero',

  // neighbours stay
  'sec(pi/2)',
  'Stop: divide by zero',

  'cot(0)',
  'Stop: divide by zero',

  'tan(pi/4)',
  '1',

  'tan(pi)',
  '0',

  'tan(3/4*pi)',
  '-1',

  'tan(x+pi/2)',
  'tan(x+1/2*pi)',

  'tan(a)',
  'tan(a)',

  'cot(pi/2)',
  '0',
]);

run_test([
  'gamma(0)',
  'Stop: divide by zero',

  // was 0
  '0*gamma(0)',
  'Stop: divide by zero',

  'gamma(-1)',
  'Stop: divide by zero',

  'gamma(-2)',
  'Stop: divide by zero',

  'gamma(1)',
  '1',

  'gamma(4)',
  '6',

  'gamma(1/2)',
  'pi^(1/2)',

  'digamma(0)',
  'Stop: divide by zero',

  'digamma(-2)',
  'Stop: divide by zero',

  // was 0
  '0*digamma(0)',
  'Stop: divide by zero',

  'digamma(x)',
  'digamma(x)',
]);

// tan with a pole at the point: 0*tan(1/2*pi) was 0
run_test([
  // sin(x) beside the point: 0.9999995, 1.0, 1.0 on both sides
  'limit(tan(x)*cos(x),x,pi/2)',
  '1',

  'limit(tan(x)*cos(x),x,pi/2,left)',
  '1',

  'limit(tan(x)*cos(x),x,pi/2,right)',
  '1',

  'limit(tan(t)*cos(t),t,pi/2)',
  '1',

  // -0.9999995, -1.0, -1.0
  'limit(tan(x)*cos(x),x,3*pi/2)',
  '-1',

  'limit(tan(x)*cos(x),x,-pi/2)',
  '-1',

  'limit(a*tan(x)*cos(x),x,pi/2)',
  'a',

  // -0.99999967, -1.0, -1.0
  'limit(tan(x)*(x-pi/2),x,pi/2)',
  '-1',

  'limit((pi/2-x)*tan(x),x,pi/2)',
  '1',

  // -0.63661925, -0.63661977 = -2/pi
  'limit(tan(pi*x/2)*(x-1),x,1)',
  '-2/pi',

  // 1.999998, 2.0, 2.0
  'limit(tan(x)*sin(2*x),x,pi/2)',
  '2',

  // -2.9999945, -3.0
  'limit(tan(x)*cos(3*x),x,pi/2)',
  '-3',

  // 0.49999963, 0.5, 0.5
  'limit(tan(x)^2*(1-sin(x)),x,pi/2)',
  '1/2',

  // 0.99999933, 1.0
  'limit((x-pi/2)^2*tan(x)^2,x,pi/2)',
  '1',

  // 0.4999995, 0.5, 0.5
  'limit(tan(2*x)*tan(pi/4-x),x,pi/4)',
  '1/2',
]);

run_test([
  // 3.000008, 3.0, 3.0 (was inf)
  'limit(tan(x)/tan(3*x),x,pi/2)',
  '3',

  // 0.33333244, 0.33333333
  'limit(tan(3*x)/tan(x),x,pi/2)',
  '1/3',
]);

run_test([
  // -0.0005, -5e-6, -5e-8 on the left, the same positive on the right
  // (was Stop: left and right limits differ)
  'limit(tan(x)-sec(x),x,pi/2)',
  '0',

  // was -inf
  'limit(tan(x)-1/cos(x),x,pi/2,left)',
  '0',

  'limit(tan(x)-1/cos(x),x,pi/2,right)',
  '0',
]);

run_test([
  // u*exp(-u) with u = tan(x) -> inf: 5e-432, 3e-43425 (was -inf)
  'limit(exp(-tan(x))*tan(x),x,pi/2,left)',
  '0',
]);

run_test([
  // 1.5697963, 1.5707863, 1.5707962 (was -1/2*pi)
  'limit(arctan(tan(x)),x,pi/2,left)',
  '1/2*pi',

  'limit(arctan(tan(x)),x,pi/2,right)',
  '-1/2*pi',

  'limit(arctan(tan(x)),x,pi/2)',
  'Stop: limit: left and right limits differ — limit does not exist',
]);

// what was right around the pole of tan stays right
run_test([
  'limit(tan(x),x,pi/2,left)',
  'inf',

  'limit(tan(x),x,pi/2,right)',
  '-inf',

  'limit(tan(x),x,pi/2)',
  'Stop: limit: left and right limits differ — limit does not exist',

  // 0.001, 1e-5, 1e-7 -> 0
  'limit(tan(x)*cos(x)^2,x,pi/2)',
  '0',

  // sin(x)^2/cos(x): 999.99917, 1e5, 1e7 on the left, negative on the right
  'limit(tan(x)^2*cos(x),x,pi/2,left)',
  'inf',

  'limit(tan(x)^2*cos(x),x,pi/2,right)',
  '-inf',

  'limit(tan(x)^2,x,pi/2)',
  'inf',

  'limit(1/tan(x),x,pi/2)',
  '0',

  'limit(tan(x),x,pi/4)',
  '1',

  'limit(tan(x),x,a)',
  'tan(a)',

  'limit(tan(x)/x,x,0)',
  '1',

  'limit((x-1)/cos(pi*x/2),x,1)',
  '-2/pi',

  'limit(x*cot(x),x,0)',
  '1',

  'limit(cos(x)/(1-sin(x)),x,pi/2,left)',
  'inf',

  'limit(exp(tan(x)),x,pi/2,right)',
  '0',

  'limit(exp(tan(x)),x,pi/2,left)',
  'inf',
]);

// gamma and digamma at their poles 0, -1, -2, ...
run_test([
  // 1.0005782, 1.0000058 | 0.99942377, 0.99999423 (was 0)
  'limit(gamma(x)*x,x,0)',
  '1',

  'limit(x*gamma(x),x,0,right)',
  '1',

  'limit(t*gamma(t),t,0,left)',
  '1',

  // gamma(x+1) evaluates to x*Gamma(x) (was 0)
  'limit(gamma(x+1),x,0)',
  '1',

  // 1.998841, 1.9999885 | 2.0011498, 2.0000115 (was 1)
  'limit(gamma(x)/gamma(2*x),x,0)',
  '2',

  // the residue of gamma at -1: -0.99957863, -0.99999577
  'limit((x+1)*gamma(x),x,-1)',
  '-1',

  // 1.000578, 1.0000058
  'limit(gamma(x)*sin(x),x,0)',
  '1',

  // residue 1/2 at -2 times pi*(x+2): 1.5693472, 1.5707818
  'limit(gamma(x)*sin(pi*x),x,-2)',
  '1/2*pi',

  // 999.42, 99999.4, 9999999.4 (was Gamma(0))
  'limit(gamma(x),x,0,right)',
  'inf',

  'limit(gamma(x),x,0,left)',
  '-inf',

  'limit(gamma(x),x,0)',
  'Stop: limit: left and right limits differ — limit does not exist',

  // was 1/(Gamma(0))
  'limit(1/gamma(x),x,0)',
  '0',

  'limit(gamma(x),x,3)',
  '2',

  'limit(gamma(x),x,a)',
  'Gamma(a)',
]);

run_test([
  // -0.99942114, -0.99999423 | -1.0005756, -1.0000058 (was 0)
  'limit(digamma(x)*x,x,0)',
  '-1',

  // -1.0004201, -1.0000042 | -0.99957457, -0.99999577
  'limit(digamma(x)*(x+1),x,-1)',
  '-1',

  // -0.9988436, -0.99998846 | -1.0011525, -1.0000115
  'limit(digamma(x)/gamma(x),x,0)',
  '-1',
]);

// log(0) stays symbolic, log(0)/log(0) cancelled to 1
run_test([
  // 0.50003618, 0.50000022, 0.5 (was 1)
  'limit(log(x)/log(x^3+x^2),x,0,right)',
  '1/2',

  'limit(log(x)/log(x^2),x,0,right)',
  '1/2',

  'limit(log(x)/log(sin(x)),x,0,right)',
  '1',

  // -0.145, -0.087, -0.062: slowly to 0
  'limit(log(x)/log(x+x^2)^2,x,0,right)',
  '0',

  'limit(log(x)-log(2*x),x,0,right)',
  '-log(2)',

  // 1.7e-7, 1.7e-11
  'limit(log(x)-log(sin(x)),x,0,right)',
  '0',

  // 0.0009995, 1e-5
  'limit(log(x^2+x)-log(x),x,0,right)',
  '0',

  'limit(x*log(x),x,0,right)',
  '0',

  'limit(x*log(x),x,0)',
  '0',

  'limit(sin(x)*log(x),x,0,right)',
  '0',

  'limit(x*log(x)^2,x,0,right)',
  '0',

  'limit(log(x),x,0,right)',
  '-inf',

  'limit(1/log(x),x,0,right)',
  '0',

  'limit(log(x)^2,x,0,right)',
  'inf',
]);

// ---------------------------------------------------------------------------
// 2. sgn, heaviside, floor, ceiling, round, abs: one numeric probe beside
//    the point is not the limit when the argument has none
// ---------------------------------------------------------------------------
run_test([
  // was -1
  'limit(sgn(sin(x)),x,infinity)',
  'Stop: limit: the limit does not exist: sin(x) oscillates',

  // was 1
  'limit(sgn(cos(x)),x,infinity)',
  'Stop: limit: the limit does not exist: cos(x) oscillates',

  'limit(sgn(sin(t)),t,-infinity)',
  'Stop: limit: the limit does not exist: sin(t) oscillates',

  // was 0
  'limit(heaviside(sin(x)),x,infinity)',
  'Stop: limit: the limit does not exist: sin(x) oscillates',

  // was -1
  'limit(floor(sin(x)),x,infinity)',
  'Stop: limit: the limit does not exist: sin(x) oscillates',

  'limit(ceiling(2*cos(x)),x,infinity)',
  'Stop: limit: the limit does not exist: cos(x) oscillates',

  'limit(round(sin(x)),x,infinity)',
  'Stop: limit: the limit does not exist: sin(x) oscillates',

  'limit(abs(sin(x)),x,infinity)',
  'Stop: limit: the limit does not exist: sin(x) oscillates',

  'limit(sgn(sin(1/x)),x,0)',
  'Stop: limit: the limit does not exist: sin(1/x) oscillates',

  'limit(3*sgn(sin(x))+1,x,infinity)',
  'Stop: limit: the limit does not exist: sin(x) oscillates',
]);

run_test([
  // was 1
  'limit((-1)^floor(x),x,infinity)',
  'Stop: limit: the limit does not exist: (-1)^(floor(x)) oscillates',

  // the fractional part: was -inf
  'limit(x-floor(x),x,infinity)',
  'Stop: limit: the limit does not exist: mod(x,1) oscillates',

  'limit(floor(x)-x,x,-infinity)',
  'Stop: limit: the limit does not exist: mod(x,1) oscillates',
]);

run_test([
  // bounded times something that goes to 0
  'limit(sgn(sin(x))/x,x,infinity)',
  '0',

  'limit(floor(sin(x))/x,x,infinity)',
  '0',

  'limit(abs(sin(x))/x,x,infinity)',
  '0',

  // 0.00083, 3.6e-7, 4.2e-8
  'limit(abs(x*sin(1/x)),x,0)',
  '0',

  'limit(x*sgn(sin(1/x)),x,0)',
  '0',
]);

// floor(u), ceiling(u), round(u) with u -> +-inf are u plus a bounded part
run_test([
  // 1.0, 1.0, 1.0 (was 0)
  'limit(floor(x)/x,x,infinity)',
  '1',

  'limit(floor(x)/x,x,-infinity)',
  '1',

  'limit(floor(n)/n,n,infinity)',
  '1',

  // was 0
  'limit(floor(2*x)/x,x,infinity)',
  '2',

  'limit(ceiling(x)/x,x,infinity)',
  '1',

  'limit(round(x)/x,x,infinity)',
  '1',

  // 0.99927061, 0.9999927, 0.99999993
  'limit(floor(x)/(x+1),x,infinity)',
  '1',

  // was 1
  'limit((x-floor(x))/x,x,infinity)',
  '0',

  // 0.00073, 7.3e-6, 7.3e-8
  'limit(floor(x)/x^2,x,infinity)',
  '0',

  'limit(floor(x),x,infinity)',
  'inf',

  'limit(ceiling(x),x,-infinity)',
  '-inf',

  'limit(floor(x)^2/x,x,infinity)',
  'inf',
]);

run_test([
  // was inf
  'limit(x/floor(x),x,infinity)',
  '1',

  'limit(x/ceiling(3*x),x,infinity)',
  '1/3',
]);

run_test([
  // 1.0, 1.0, 1.0 on both sides
  'limit(x*floor(1/x),x,0)',
  '1',

  'limit(x*floor(1/x),x,0,right)',
  '1',
]);

// at a finite point floor and ceiling have one-sided limits
run_test([
  'limit(floor(x),x,2,left)',
  '1',

  'limit(floor(x),x,2,right)',
  '2',

  'limit(floor(x),x,2)',
  'Stop: limit: left and right limits differ — limit does not exist',

  'limit(ceiling(x),x,2,left)',
  '2',

  'limit(ceiling(x),x,2,right)',
  '3',

  'limit(floor(x),x,5/2)',
  '2',

  'limit(floor(x^2),x,0)',
  '0',

  'limit(floor(-x^2),x,0)',
  '-1',

  // was 1
  'limit(round(x),x,1/2,left)',
  '0',

  'limit(round(x),x,1/2,right)',
  '1',

  'limit(round(x),x,1/3)',
  '0',

  'limit(sgn(x)*x,x,0)',
  '0',

  'limit(sgn(x^2),x,0)',
  '1',

  'limit(sgn(x),x,0,left)',
  '-1',

  'limit(heaviside(x),x,0,right)',
  '1',

  'limit(abs(x)/x,x,infinity)',
  '1',

  'limit(abs(x)/x,x,-infinity)',
  '-1',

  'limit(sgn(x),x,infinity)',
  '1',

  'limit(abs(x)/x,x,0)',
  'Stop: limit: left and right limits differ — limit does not exist',
]);

// ---------------------------------------------------------------------------
// 3. No wrong value, but no answer
// ---------------------------------------------------------------------------
// the exponential beats every power
run_test([
  'limit(x^10/exp(x),x,infinity)',
  '0',

  'limit(x^20/exp(x),x,infinity)',
  '0',

  'limit(x^3*exp(-x),x,infinity)',
  '0',

  'limit(exp(x)/x^5,x,infinity)',
  'inf',

  'limit(exp(t)/t^7,t,infinity)',
  'inf',

  'limit(x*exp(x),x,infinity)',
  'inf',
]);

run_test([
  // -1.4e-592
  'limit(x*exp(x),x,-infinity)',
  '0',

  'limit(exp(x)*x^3,x,-infinity)',
  '0',
]);

run_test([
  // 5e-426
  'limit(exp(-1/x)/x^3,x,0,right)',
  '0',

  'limit(exp(-1/abs(x))/x^5,x,0)',
  '0',
]);

run_test([
  // 0.00073, 7.3e-6, 7.3e-8
  'limit(sqrt(x^2+1)-sqrt(x^2-1),x,infinity)',
  '0',
]);

run_test([
  // 0.99999982, 1.0
  'limit(x*(pi/2-arctan(x)),x,infinity)',
  '1',

  'limit(x*(pi/2+arctan(x)),x,-infinity)',
  '-1',
]);

run_test([
  // 0.99948763, 1.0000062, 0.99999994
  'limit((x+sin(x))/(x+cos(x)),x,infinity)',
  '1',

  // 3.0023062, 3.0000104, 2.9999999
  'limit((3*x+sin(x))/(x-cos(x)),x,infinity)',
  '3',

  // 0.50027198, 0.50000387
  'limit((x+sin(x))/(2*x+cos(x)),x,-infinity)',
  '1/2',
]);

run_test([
  // bounded plus infinite
  'limit(sin(x)+x,x,infinity)',
  'inf',

  'limit(cos(x)-x,x,infinity)',
  '-inf',

  'limit(sin(x)+x,x,-infinity)',
  '-inf',

  // stays: x*sin(x) alone has no limit
  'limit(x*sin(x),x,infinity)',
  'Stop: limit: the limit does not exist: sin(x) oscillates',
]);

run_test([
  // 3.0, 3.0, 3.0
  'limit((2^x+3^x)^(1/x),x,infinity)',
  '3',
]);

run_test([
  // two bounded factors, one of them goes to 0: 0.00083, 3.6e-7, 4.2e-8
  'limit(sin(x)*sin(1/x),x,0)',
  '0',

  'limit(cos(1/x)*sin(x),x,0)',
  '0',

  'limit(sin(x)*sin(1/x),x,infinity)',
  '0',

  // the product is expanded by the evaluator
  'limit((x-1)*sin(1/(x-1)),x,1)',
  '0',

  'limit(sin(x)*sin(1/sin(x)),x,pi)',
  '0',
]);

run_test([
  // 0.84648172 = exp(-1/6) on both sides
  'limit((sin(x)/x)^(1/x^2),x,0)',
  'exp(-1/6)',
]);

// found on the way: sin(x)/x goes to 1, so sin(1/x) decides (a squeeze of
// the two bounded factors alone would say 0)
run_test([
  'limit(sin(1/x)*sin(x)/x,x,0)',
  'Stop: limit: the limit does not exist: sin(1/x) oscillates',

  'limit(sin(x)*cos(1/x)/x,x,0)',
  'Stop: limit: the limit does not exist: cos(1/x) oscillates',

  // 3*sin(x)*sin(1/x): a constant factor changes nothing
  'limit(3*sin(x)*sin(1/x),x,0)',
  '0',
]);

// 0*inf with a logarithm of tan: h*log(1/h) with h = pi/2-x, 0.0069, 0.000115
// (these were right only because 0*log(tan(1/2*pi)) was 0)
run_test([
  'limit(cos(x)*log(tan(x)),x,pi/2,left)',
  '0',

  'limit(tan(x)^cos(x),x,pi/2,left)',
  '1',

  'limit(x*log(sin(x)),x,0,right)',
  '0',
]);
