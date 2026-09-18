import { run_test } from '../test-harness';

run_test([
  'besselj(x,n)',
  'besselj(x,n)',

  'besselj(0,0)',
  '1',

  'besselj(0,1)',
  '0',

  'besselj(0,-1)',
  '0',

  'besselj(x,1/2)-sqrt(2/pi/x)*sin(x)',
  '0',

  'besselj(x,-1/2)-sqrt(2/pi/x)*cos(x)',
  '0',

  'besselj(x,3/2)-sqrt(2/pi/x)*(sin(x)/x-cos(x))',
  '0',

  'besselj(x,-3/2)-sqrt(2/pi/x)*(-cos(x)/x-sin(x))',
  '0',

  'besselj(x,5/2)-sqrt(2/pi/x)*((3/x^2-1)*sin(x)-3/x*cos(x))',
  '0',

  'besselj(x,-5/2)-sqrt(2/pi/x)*((3/x^2-1)*cos(x)+3/x*sin(x))',
  '0',

  // From the note above

  'besselj(x,3/2)-(1/x)*besselj(x,1/2)+besselj(x,-1/2)',
  '0',

  'besselj(x,-3/2)+(1/x)*besselj(x,-1/2)+besselj(x,1/2)',
  '0',

  // this should simplify

  'y=besselj(x,5/2)',
  '',

  'x^2*d(y,x,x)+x*d(y,x)+(x^2-(5/2)^2)*y',
  '0',

  'y=quote(y)',
  '',

  // J_n(0) = 0 for n > 0 and for integers n != 0
  'besselj(0,5)',
  '0',

  'besselj(0,1/2)',
  '0',

  'besselj(0,3/2)',
  '0',

  // J_(-1/2)(0) is infinite
  'besselj(0,-1/2)',
  'Stop: divide by zero',

  // J_(-n) = (-1)^n J_n, J_n(-x) = (-1)^n J_n(x)
  'besselj(x,-1)',
  '-besselj(x,1)',

  'besselj(x,-2)',
  'besselj(x,2)',

  'besselj(-x,2)',
  'besselj(x,2)',

  'besselj(-x,3)',
  '-besselj(x,3)',

  // J_0' = -J_1
  'd(besselj(x,0),x)+besselj(x,1)',
  '0',

  // Bessel equation for n = 1/2
  'y=besselj(x,1/2)',
  '',

  'x^2*d(y,x,2)+x*d(y,x)+(x^2-1/4)*y',
  '0',

  'y=quote(y)',
  '',

  // wrong number of arguments
  'besselj(x)',
  'Stop: besselj: expected 2 arguments, got 1',
]);
