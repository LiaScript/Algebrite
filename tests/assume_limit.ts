import { run_test } from '../test-harness';

// limit and defint with a parameter of known sign: a*inf, inf^a and the
// sign beside a pole come from the assumptions. Without an assumption the
// results stay undecided.
run_test([
  // without an assumption the sign of a is unknown
  'limit(exp(a*x),x,inf)',
  "Stop: limit: could not resolve after repeated L'Hopital iterations",

  'limit(a*x,x,inf)',
  'Stop: limit: could not determine a real sign beside the point — try a one-sided limit',

  'limit(a/x,x,0,1)',
  'Stop: limit: could not determine a real sign beside the point — try a one-sided limit',

  'limit(x^2/a,x,inf)',
  'inf/a',

  // a term next to inf is absorbed only when its sign is known
  'inf+x',
  'inf+x',

  'inf+pi',
  'inf',

  // a > 0
  'assume(a>0)',
  '',

  'limit(exp(a*x),x,inf)',
  'inf',

  'limit(exp(-a*x),x,inf)',
  '0',

  'limit(exp(a*x),x,-inf)',
  '0',

  'limit(a*x,x,inf)',
  'inf',

  'limit(-a*x,x,inf)',
  '-inf',

  'limit(a*x,x,-inf)',
  '-inf',

  'limit(x^a,x,inf)',
  'inf',

  'limit(1/x^a,x,inf)',
  '0',

  'limit(arctan(a*x),x,inf)',
  '1/2*pi',

  'limit(arctan(a*x),x,-inf)',
  '-1/2*pi',

  'limit(x^2/a,x,inf)',
  'inf',

  'limit(exp(-a*x^2),x,inf)',
  '0',

  'inf-1/a',
  'inf',

  '-inf+a^2',
  '-inf',

  // one-sided limits at a pole
  'limit(a/x,x,0,1)',
  'inf',

  'limit(a/x,x,0,-1)',
  '-inf',

  'limit(a/x,x,0)',
  'Stop: limit: left and right limits differ — limit does not exist',

  'limit(a/x^2,x,0)',
  'inf',

  // improper integrals
  'defint(exp(-a*x),x,0,inf)',
  '1/a',

  'defint(1/(x^2+a^2),x,-inf,inf)',
  'pi/a',

  'defint(x*exp(-a*x),x,0,inf)',
  '1/a^2',

  // divergent
  'defint(exp(a*x),x,0,inf)',
  'inf',

  // the pole x = a > 0 lies inside (0,inf)
  'defint(1/(x-a)^2,x,0,inf)',
  'Stop: defint: the integrand has a pole at x = a inside the interval',

  // x = -a < 0 is outside
  'defint(1/(x+a)^2,x,0,inf)',
  '1/a',

  // 0 < a < 1 would put the pole in (0,1): unknown, so as before
  'defint(1/(x+a),x,0,1)',
  '-log(a)+log(1+a)',

  // a < 0
  'forget(a)',
  '',

  'assume(a<0)',
  '',

  'limit(exp(a*x),x,inf)',
  '0',

  'limit(exp(-a*x),x,inf)',
  'inf',

  'limit(a*x,x,inf)',
  '-inf',

  'limit(x^a,x,inf)',
  '0',

  'limit(1/x^a,x,inf)',
  'inf',

  'limit(arctan(a*x),x,inf)',
  '-1/2*pi',

  'limit(a/x,x,0,1)',
  '-inf',

  'defint(exp(a*x),x,0,inf)',
  '-1/a',

  'defint(exp(-a*x),x,0,inf)',
  'inf',

  // pi/abs(a)
  'defint(1/(x^2+a^2),x,-inf,inf)',
  '-pi/a',

  // the pole x = a < 0 lies inside (-inf,0), but not inside (0,inf)
  'defint(1/(x-a)^2,x,-inf,0)',
  'Stop: defint: the integrand has a pole at x = a inside the interval',

  'defint(1/(x-a)^2,x,0,inf)',
  '-1/a',

  'forget()',
  '',
]);
