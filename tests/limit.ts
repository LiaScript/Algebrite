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

  // L'Hopital only applies to 0/0: an expression that cannot be evaluated
  // at the point must stop rather than produce a wrong answer (pi/2 here)
  'limit(arctan(x),x,inf)',
  "Stop: limit: could not resolve after repeated L'Hopital iterations",
]);
