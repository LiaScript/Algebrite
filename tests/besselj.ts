import { run_test } from '../test-harness';

run_test([
  'besselj(n,x)',
  'besselj(n,x)',

  'besselj(0,0)',
  '1',

  'besselj(1,0)',
  '0',

  'besselj(-1,0)',
  '0',

  'besselj(1/2,x)-sqrt(2/pi/x)*sin(x)',
  '0',

  'besselj(-1/2,x)-sqrt(2/pi/x)*cos(x)',
  '0',

  'besselj(3/2,x)-sqrt(2/pi/x)*(sin(x)/x-cos(x))',
  '0',

  'besselj(-3/2,x)-sqrt(2/pi/x)*(-cos(x)/x-sin(x))',
  '0',

  'besselj(5/2,x)-sqrt(2/pi/x)*((3/x^2-1)*sin(x)-3/x*cos(x))',
  '0',

  'besselj(-5/2,x)-sqrt(2/pi/x)*((3/x^2-1)*cos(x)+3/x*sin(x))',
  '0',

  // From the note above

  'besselj(3/2,x)-(1/x)*besselj(1/2,x)+besselj(-1/2,x)',
  '0',

  'besselj(-3/2,x)+(1/x)*besselj(-1/2,x)+besselj(1/2,x)',
  '0',

  // this should simplify

  'y=besselj(5/2,x)',
  '',

  'x^2*d(y,x,x)+x*d(y,x)+(x^2-(5/2)^2)*y',
  '0',

  'y=quote(y)',
  '',

  // J_n(0) = 0 for n > 0 and for integers n != 0
  'besselj(5,0)',
  '0',

  'besselj(1/2,0)',
  '0',

  'besselj(3/2,0)',
  '0',

  // J_(-1/2)(0) is infinite
  'besselj(-1/2,0)',
  'Stop: divide by zero',

  // J_(-n) = (-1)^n J_n, J_n(-x) = (-1)^n J_n(x)
  'besselj(-1,x)',
  '-besselj(1,x)',

  'besselj(-2,x)',
  'besselj(2,x)',

  'besselj(2,-x)',
  'besselj(2,x)',

  'besselj(3,-x)',
  '-besselj(3,x)',

  // J_0' = -J_1
  'd(besselj(0,x),x)+besselj(1,x)',
  '0',

  // Bessel equation for n = 1/2
  'y=besselj(1/2,x)',
  '',

  'x^2*d(y,x,2)+x*d(y,x)+(x^2-1/4)*y',
  '0',

  'y=quote(y)',
  '',

  // numeric values (tables of Abramowitz and Stegun)
  'besselj(0,1.0)',
  '0.765198...',

  'besselj(1,1.0)',
  '0.440051...',

  'besselj(2,2.5)',
  '0.446059...',

  'besselj(0,10.0)',
  '-0.245936...',

  'besselj(1,-1.0)',
  '-0.440051...',

  'besselj(-1,1.0)',
  '-0.440051...',

  'float(besselj(0,1))',
  '0.765198...',

  'besselj(1,0.0)',
  '0.0',

  // wrong number of arguments
  'besselj(x)',
  'Stop: besselj: expected 2 arguments, got 1',

  // besselj(n, x): order first, as in Maxima, Mathematica and SymPy.
  // J0(1) = 0.7651976866, J1(2) = 0.5767248078
  'float(besselj(0,1))',
  '0.765198...',

  'float(besselj(1,2))',
  '0.576725...',

  // J0' = -J1
  'd(besselj(0,x),x)',
  '-besselj(1,x)',

  'd(besselj(0,2*x),x)',
  '-2*besselj(1,2*x)',
]);
