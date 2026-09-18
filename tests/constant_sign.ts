import { run_test } from '../test-harness';

// The sign of a real constant without symbols, such as pi-4 or
// 2^(1/2)-3^(1/2), is read off its float value when the rules for sums,
// products and powers cannot decide it. A value within 10^(-6) of zero stays
// undecided. abs, sgn, the is... queries, sqrt(u^2) and logs profit.
// Values: pi-4 = -0.858, 2^(1/2)-3^(1/2) = -0.318, exp(1)-3 = -0.282,
// log(2)-1 = -0.307, sin(1)-1 = -0.159, cos(2) = -0.416,
// 49*2^(1/2)+100*5^(1/2)-70*2^(3/4)*5^(1/4) = 117.05.

run_test([
  'abs(pi-4)',
  '4-pi',

  'abs(4-pi)',
  '4-pi',

  'abs(2^(1/2)-3^(1/2))',
  '-2^(1/2)+3^(1/2)',

  'abs(exp(1)-3)',
  '3-exp(1)',

  'abs(log(2)-1)',
  '1-log(2)',

  'abs(sin(1)-1)',
  '1-sin(1)',

  'abs(cos(2))',
  '-cos(2)',

  'abs(arctan(2^(1/4)))',
  'arctan(2^(1/4))',

  'abs(49*2^(1/2)+100*5^(1/2)-70*2^(3/4)*5^(1/4))',
  '49*2^(1/2)+100*5^(1/2)-70*2^(3/4)*5^(1/4)',

  // a product and a quotient of such constants
  'abs((pi-4)*(2^(1/2)-3^(1/2)))',
  '(4-pi)*(-2^(1/2)+3^(1/2))',

  'abs(1/(pi-4))',
  '1/(4-pi)',
]);

run_test([
  'sgn(2^(1/2)-3^(1/2))',
  '-1',

  'sgn(pi-3)',
  '1',

  'sgn(cos(2))',
  '-1',

  'isnegative(2^(1/2)-3^(1/2))',
  '1',

  'ispositive(pi-3)',
  '1',

  'isnonzero(pi-22/7)',
  '1',

  'isreal(pi-4)',
  '1',

  // sqrt(u^2) = abs(u) = -u for a negative constant
  'sqrt((pi-4)^2)',
  '4-pi',

  'log((pi-4)^2)',
  '2*log(4-pi)',
]);

// not decided
run_test([
  // too close to zero: pi-355/113 = -2.7*10^(-7)
  'abs(pi-355/113)',
  'abs(355/113-pi)',

  'sgn(pi-355/113)',
  'sgn(-355/113+pi)',

  // a symbol
  'abs(x+2^(1/2)-3^(1/2))',
  'abs(x+2^(1/2)-3^(1/2))',

  'abs(a*(pi-4))',
  '(4-pi)*abs(a)',

  // complex constants keep their modulus
  'abs(1+i)',
  '2^(1/2)',

  'abs(i*2^(1/2)-3)',
  '11^(1/2)',

  'sgn(i)',
  'sgn(i)',

  // exact zero in disguise
  'abs(2^(1/2)*3^(1/2)-6^(1/2))',
  '0',
]);

// abs of a long constant with nested radicals ran into "Maximum call stack
// size exceeded": the unresolved abs and sgn of constants inside sent
// rationalize into a loop. c is 0, the derivative of the antiderivative
// minus the integrand at x = 7/10.
run_test([
  'F=integral(3/(2*x^4+5),x)',
  '',

  'c=eval(d(F,x)-3/(2*x^4+5),x,7/10)',
  '',

  'float(abs(c))<10^(-9)',
  '1',
]);
