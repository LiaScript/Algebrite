import { run_test } from '../test-harness';

run_test([
  'limit(x^2,x,2)',
  '4',

  'limit(x+1,x,0)',
  '1',

  'limit((x^2-4)/(x-2),x,2)',
  '4',

  'limit(sin(x)/x,x,0)',
  '1',

  // infinite limits: the sign is probed numerically on both sides
  'limit(1/x^2,x,0)',
  'inf',

  'limit(-1/x^2,x,0)',
  '-inf',

  'limit(1/(x-2)^2,x,2)',
  'inf',

  'limit(1/x,x,0)',
  'Stop: limit: left and right limits differ — limit does not exist',

  // the sign cannot be probed at a symbolic point
  'limit(1/(x-a)^2,x,a)',
  'Stop: limit: denominator vanishes while numerator does not — limit is infinite or does not exist',

  // limits at infinity: x = 1/t with t -> 0 from the right
  'limit(1/x,x,inf)',
  '0',

  'limit(5,x,inf)',
  '5',

  'limit(x,x,inf)',
  'inf',

  'limit(-x,x,inf)',
  '-inf',

  'limit(x,x,-inf)',
  '-inf',

  'limit(x^2,x,-inf)',
  'inf',

  'limit(x^2-x,x,inf)',
  'inf',

  'limit((2*x^2+1)/(x^2-3),x,inf)',
  '2',

  'limit((3*x+1)/(x^2+1),x,inf)',
  '0',

  'limit((x^3+1)/(x^2+1),x,-inf)',
  '-inf',

  'limit(x*sin(1/x),x,inf)',
  '1',

  // one-sided limits: a 4th argument, positive = from the right
  'limit(1/x,x,0,1)',
  'inf',

  'limit(1/x,x,0,-1)',
  '-inf',

  'limit(1/x^2,x,0,-1)',
  'inf',

  'limit(x^2,x,2,1)',
  '4',

  'limit(sec(x),x,pi/2,-1)',
  'inf',

  'limit(1/x,x,0,0)',
  'Stop: limit: 4th argument must be a positive or negative number',

  // poles of tan and log: substitution gives tan(1/2*pi) or log(0), which
  // is detected and resolved by the sign beside the point
  'limit(tan(x),x,pi/2,-1)',
  'inf',

  'limit(tan(x),x,pi/2,1)',
  '-inf',

  'limit(tan(x),x,pi/2)',
  'Stop: limit: left and right limits differ — limit does not exist',

  'limit(log(x),x,0,1)',
  '-inf',

  'limit(-log(x),x,0,1)',
  'inf',

  // log(x) is not real left of 0
  'limit(log(x),x,0)',
  'Stop: limit: could not determine a real sign beside the point — try a one-sided limit',

  // jump functions (sgn, abs, floor, ceiling): each side is solved with the
  // function replaced by what it equals on that side, then compared
  'limit(abs(x)/x,x,0)',
  'Stop: limit: left and right limits differ — limit does not exist',

  'limit(abs(x)/x,x,0,1)',
  '1',

  'limit(abs(x)/x,x,0,-1)',
  '-1',

  'limit(abs(x),x,0)',
  '0',

  'limit(abs(x-1)/(x-1),x,1,1)',
  '1',

  'limit(sgn(x),x,0,1)',
  '1',

  'limit(sgn(x),x,0,-1)',
  '-1',

  'limit(sgn(x),x,0)',
  'Stop: limit: left and right limits differ — limit does not exist',

  'limit(sgn(x)*x,x,0)',
  '0',

  'limit(heaviside(x),x,0,1)',
  '1',

  'limit(heaviside(x),x,0,-1)',
  '0',

  'limit(floor(x),x,2,-1)',
  '1',

  'limit(floor(x),x,2,1)',
  '2',

  'limit(floor(x),x,5/2)',
  '2',

  'limit(ceiling(x),x,2,1)',
  '3',

  'limit(abs(x)/x,x,inf)',
  '1',

  'limit(abs(x)/x,x,-inf)',
  '-1',

  // the sign of a*x cannot be probed, so this falls back to substitution
  'limit(abs(a*x),x,0)',
  '0',

  // functions with a value at +-inf
  'limit(arctan(x),x,inf)',
  '1/2*pi',

  'limit(arctan(x),x,-inf)',
  '-1/2*pi',

  'limit(erf(x),x,inf)',
  '1',

  'limit(erf(x),x,-inf)',
  '-1',

  'limit(erfc(x),x,inf)',
  '0',

  'limit(tanh(x),x,-inf)',
  '-1',

  'limit(cosh(x),x,inf)',
  'inf',

  // exponentials at +-inf
  'limit(exp(-x),x,inf)',
  '0',

  'limit(exp(x),x,inf)',
  'inf',

  'limit(exp(x),x,-inf)',
  '0',

  'limit(exp(-x^2),x,-inf)',
  '0',

  'limit(2^x,x,inf)',
  'inf',

  'limit(2^(-x),x,inf)',
  '0',

  'limit(0.5^x,x,inf)',
  '0',

  'limit(x^(-1/2),x,inf)',
  '0',

  'limit(exp(1/x),x,inf)',
  '1',

  // inf times a constant
  'limit(pi*x,x,inf)',
  'inf',

  'limit(x*arctan(x),x,inf)',
  'inf',

  // inf-inf, inf/inf and 0*inf at infinity: L'Hopital in x
  'limit(x-log(x),x,inf)',
  'inf',

  'limit(log(x)-x,x,inf)',
  '-inf',

  'limit(x*exp(-x),x,inf)',
  '0',

  'limit(x^2*exp(-x),x,inf)',
  '0',

  'limit(exp(x)/x^3,x,inf)',
  'inf',

  'limit(log(x)^2/x,x,inf)',
  '0',

  'limit(x/log(x),x,inf)',
  'inf',

  'limit(log(x^2+1)/log(x),x,inf)',
  '2',

  'limit(x/(x+exp(-x)),x,inf)',
  '1',

  // 1^inf, inf^0, 0^0 are indeterminate (not 1): e, 1, e^-1 here
  'limit((1+1/x)^x,x,inf)',
  "Stop: limit: could not resolve after repeated L'Hopital iterations",

  // x^(1/x) = exp(log(x)/x) -> exp(0) = 1, solvable now that x > 0 is known
  // near inf
  'limit(x^(1/x),x,inf)',
  '1',

  // exp(-x)^(1/x) is exp(-1) for real x, so this one is not indeterminate
  'limit(exp(-x)^(1/x),x,inf)',
  'exp(-1)',

  // no limit
  'limit(sin(x),x,inf)',
  "Stop: limit: could not resolve after repeated L'Hopital iterations",

  // 0/0 at a point
  'limit((1-cos(x))/x^2,x,0)',
  '1/2',

  'limit((exp(x)-1)/x,x,0)',
  '1',

  'limit(sin(3*x)/x,x,0)',
  '3',

  'limit(tan(x)/x,x,0)',
  '1',

  'limit(log(1+x)/x,x,0)',
  '1',

  'limit((x-sin(x))/x^3,x,0)',
  '1/6',

  'limit((x^3-8)/(x-2),x,2)',
  '12',

  'limit((x^2-a^2)/(x-a),x,a)',
  '2*a',

  // one-sided limits at 0
  'limit(x*log(x),x,0,1)',
  '0',

  'limit(x^x,x,0,1)',
  '1',

  'limit(sqrt(x),x,0,1)',
  '0',

  'limit(1/sqrt(x),x,0,1)',
  'inf',

  'limit(1/x^3,x,0,1)',
  'inf',

  'limit(1/x^3,x,0)',
  'Stop: limit: left and right limits differ — limit does not exist',

  'limit(1/(x^2-1),x,1,1)',
  'inf',

  'limit(1/(x^2-1),x,1,-1)',
  '-inf',

  // constants, other variables, tensors
  'limit(a,x,0)',
  'a',

  'limit(x^2+y,x,1)',
  'y+1',

  'limit([x,x^2],x,2)',
  '[2,4]',

  // wrong number of arguments
  'limit(x)',
  'Stop: limit: expected 3 to 4 arguments, got 1',

  'limit(x,x,0,1,2)',
  'Stop: limit: expected 3 to 4 arguments, got 5',
]);
