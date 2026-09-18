import { run_test } from '../test-harness';

// arcsec/arccsc/arccot rewrite to arccos(1/x), arcsin(1/x), arctan(1/x).
// arccot(0) is not covered: 1/0 stops with "divide by zero".
run_test([
  'arcsec(2)',
  '1/3*pi',

  'arcsec(1)',
  '0',

  'arcsec(x)',
  'arccos(1/x)',

  'arccsc(2)',
  '1/6*pi',

  'arccsc(x)',
  'arcsin(1/x)',

  'arccot(1)',
  '1/4*pi',

  'arccot(x)',
  'arctan(1/x)',

  'd(arccot(x),x)',
  '-1/(x^2+1)',

  'arcsec(-1)',
  'pi',

  'arcsec(-2)',
  '2/3*pi',

  'arcsec(sqrt(2))',
  '1/4*pi',

  'arcsec(2/sqrt(3))',
  '1/6*pi',

  'arcsec(2.0)',
  '1.047198...',

  // |x| < 1 is outside the domain of arcsec and arccsc
  'arcsec(1/2)',
  'arccos(2)',

  'arcsec(0.5)',
  'Stop: arccos function argument is not in the interval [-1,1]',

  'arcsec(0)',
  'Stop: divide by zero',

  // 1/(abs(x)*(x^2-1)^(1/2))
  'd(arcsec(x),x)',
  '1/(x^2*(1-1/(x^2))^(1/2))',

  'arccsc(1)',
  '1/2*pi',

  'arccsc(-1)',
  '-1/2*pi',

  'arccsc(-2)',
  '-1/6*pi',

  'arccsc(sqrt(2))',
  '1/4*pi',

  'arccsc(2.0)',
  '0.523599...',

  'arccsc(0)',
  'Stop: divide by zero',

  'd(arccsc(x),x)',
  '-1/(x^2*(1-1/(x^2))^(1/2))',

  // arccot(x) = arctan(1/x), so arccot of a negative number is negative
  'arccot(-1)',
  '-1/4*pi',

  'arccot(sqrt(3))',
  '1/6*pi',

  'arccot(1/sqrt(3))',
  '1/3*pi',

  'arccot(1.0)',
  '0.785398...',

  'arccot(-1.0)',
  '-0.785398...',

  // hyperbolic companions
  'arcsech(1)',
  '0',

  'arcsech(0.5)',
  '1.316958...',

  'float(arcsech(1/2))',
  '1.316958...',

  'arccsch(1.0)',
  '0.881374...',

  'arccsch(0)',
  'Stop: divide by zero',

  'arccoth(2.0)',
  '0.549306...',

  'float(arccoth(2))',
  '0.549306...',

  // |x| < 1 is outside the domain of arccoth
  'arccoth(0.5)',
  'Stop: arctanh function argument is not in the interval [-1,1]',
]);
