import { run_test } from '../test-harness';

run_test([
  'legendre(n,x)',
  'legendre(n,0,x)',

  'legendre(n,m,x)',
  'legendre(n,m,x)',

  'legendre(0,x)-1',
  '0',

  'legendre(1,x)-x',
  '0',

  'legendre(2,x)-1/2*(3*x^2-1)',
  '0',

  'legendre(3,x)-1/2*(5*x^3-3*x)',
  '0',

  'legendre(4,x)-1/8*(35*x^4-30*x^2+3)',
  '0',

  'legendre(5,x)-1/8*(63*x^5-70*x^3+15*x)',
  '0',

  'legendre(6,x)-1/16*(231*x^6-315*x^4+105*x^2-5)',
  '0',

  'legendre(0,0,x)-1',
  '0',

  'legendre(1,0,x)-x',
  '0',

  'legendre(1,1,x)+(1-x^2)^(1/2)',
  '0',

  'legendre(2,0,x)-1/2*(3*x^2-1)',
  '0',

  'legendre(2,1,x)+3*x*(1-x^2)^(1/2)',
  '0',

  'legendre(2,2,x)-3*(1-x^2)',
  '0',

  'legendre(3,0,x)-1/2*x*(5*x^2-3)',
  '0',

  'legendre(3,1,x)-3/2*(1-5*x^2)*(1-x^2)^(1/2)',
  '0',

  'legendre(3,2,x)-15*x*(1-x^2)',
  '0',

  'legendre(3,3,x)+15*(1-x^2)^(3/2)',
  '0',

  'legendre(4,0,x)-1/8*(35*x^4-30*x^2+3)',
  '0',

  'legendre(4,1,x)-5/2*x*(3-7*x^2)*(1-x^2)^(1/2)',
  '0',

  'legendre(4,2,x)-15/2*(7*x^2-1)*(1-x^2)',
  '0',

  'legendre(4,3,x)+105*x*(1-x^2)^(3/2)',
  '0',

  'legendre(4,4,x)-105*(1-x^2)^2',
  '0',

  'legendre(5,0,x)-1/8*x*(63*x^4-70*x^2+15)',
  '0',

  'legendre(0,0,cos(theta))-1',
  '0',

  'legendre(1,0,cos(theta))-cos(theta)',
  '0',

  'legendre(1,1,cos(theta))+abs(sin(theta))',
  '0',

  'legendre(2,0,cos(theta))-1/2*(3*cos(theta)^2-1)',
  '0',

  'legendre(2,1,cos(theta))+3*cos(theta)*abs(sin(theta))',
  '0',

  'legendre(2,2,cos(theta))-3*sin(theta)^2',
  '0',

  'legendre(3,0,cos(theta))-1/2*cos(theta)*(5*cos(theta)^2-3)',
  '0',

  'legendre(3,1,cos(theta))- (3/2*abs(sin(theta))-15/2*cos(theta)^2*abs(sin(theta)))',
  '0',

  'legendre(3,2,cos(theta))-15*cos(theta)*sin(theta)^2',
  '0',

  'legendre(3,3,cos(theta))+15*(sin(theta)^2)^(3/2)',
  '0',

  'legendre(10,a-b)-eval(subst(a-b,x,legendre(10,x)))',
  '0',

  // P_n(1) = 1, P_n(-1) = (-1)^n
  'legendre(5,1)',
  '1',

  'legendre(5,-1)',
  '-1',

  'legendre(4,0)',
  '3/8',

  'legendre(3,0.5)',
  '-0.4375',

  // m > n
  'legendre(2,3,x)',
  '0',

  // Legendre equation (1-x^2)*y'' - 2*x*y' + n*(n+1)*y = 0
  'y=legendre(5,x)',
  '',

  '(1-x^2)*d(y,x,2)-2*x*d(y,x)+30*y',
  '0',

  'y=quote(y)',
  '',

  // orthogonality on [-1,1], norm 2/(2*n+1)
  'defint(legendre(2,x)*legendre(3,x),x,-1,1)',
  '0',

  'defint(legendre(3,x)^2,x,-1,1)',
  '2/7',

  'defint(legendre(4,x)^2,x,-1,1)',
  '2/9',

  // negative orders stay unevaluated
  'legendre(-1,x)',
  'legendre(-1,0,x)',

  'legendre(2,-1,x)',
  'legendre(2,-1,x)',

  // tensors are not mapped over (x^2 would be a dot product)
  'legendre(2,[x,1])',
  'legendre(2,0,[x,1])',

  // wrong number of arguments
  'legendre(x,1,2,3)',
  'Stop: legendre: expected 2 to 3 arguments, got 4',
]);
