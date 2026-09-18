import { run_test } from '../test-harness';

run_test([
  'hermite(n,x)',
  'hermite(n,x)',

  'hermite(0,x)-1',
  '0',

  'hermite(1,x)-2*x',
  '0',

  'hermite(2,x)-(4*x^2-2)',
  '0',

  'hermite(3,x)-(8*x^3-12*x)',
  '0',

  'hermite(4,x)-(16*x^4-48*x^2+12)',
  '0',

  'hermite(5,x)-(32*x^5-160*x^3+120*x)',
  '0',

  'hermite(6,x)-(64*x^6-480*x^4+720*x^2-120)',
  '0',

  'hermite(7,x)-(128*x^7-1344*x^5+3360*x^3-1680*x)',
  '0',

  'hermite(8,x)-(256*x^8-3584*x^6+13440*x^4-13440*x^2+1680)',
  '0',

  'hermite(9,x)-(512*x^9-9216*x^7+48384*x^5-80640*x^3+30240*x)',
  '0',

  'hermite(10,x)-(1024*x^10-23040*x^8+161280*x^6-403200*x^4+302400*x^2-30240)',
  '0',

  'hermite(10,a-b)-eval(subst(a-b,x,hermite(10,x)))',
  '0',

  // values at points (physicists' H_n)
  'hermite(4,0)',
  '12',

  'hermite(5,0)',
  '0',

  'hermite(3,1)',
  '-4',

  'hermite(3,2.0)',
  '40.0',

  // H_n' = 2*n*H_(n-1)
  'd(hermite(5,x),x)-10*hermite(4,x)',
  '0',

  // Hermite equation y'' - 2*x*y' + 2*n*y = 0
  'y=hermite(6,x)',
  '',

  'd(y,x,2)-2*x*d(y,x)+12*y',
  '0',

  'y=quote(y)',
  '',

  // negative, non-integer or symbolic orders stay unevaluated
  'hermite(-1,x)',
  'hermite(-1,x)',

  'hermite(1/2,x)',
  'hermite(1/2,x)',

  'hermite(n+1,x)',
  'hermite(1+n,x)',

  // tensors are not mapped over (x^2 would be a dot product: 4*x^2+2)
  'hermite(2,[x,1])',
  'hermite(2,[x,1])',

  // wrong number of arguments
  'hermite(x)',
  'Stop: hermite: expected 2 arguments, got 1',
]);
