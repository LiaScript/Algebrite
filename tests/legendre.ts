import { run_test } from '../test-harness';

run_test([
  'legendre(x,n)',
  'legendre(x,n,0)',

  'legendre(x,n,m)',
  'legendre(x,n,m)',

  'legendre(x,0)-1',
  '0',

  'legendre(x,1)-x',
  '0',

  'legendre(x,2)-1/2*(3*x^2-1)',
  '0',

  'legendre(x,3)-1/2*(5*x^3-3*x)',
  '0',

  'legendre(x,4)-1/8*(35*x^4-30*x^2+3)',
  '0',

  'legendre(x,5)-1/8*(63*x^5-70*x^3+15*x)',
  '0',

  'legendre(x,6)-1/16*(231*x^6-315*x^4+105*x^2-5)',
  '0',

  'legendre(x,0,0)-1',
  '0',

  'legendre(x,1,0)-x',
  '0',

  'legendre(x,1,1)+(1-x^2)^(1/2)',
  '0',

  'legendre(x,2,0)-1/2*(3*x^2-1)',
  '0',

  'legendre(x,2,1)+3*x*(1-x^2)^(1/2)',
  '0',

  'legendre(x,2,2)-3*(1-x^2)',
  '0',

  'legendre(x,3,0)-1/2*x*(5*x^2-3)',
  '0',

  'legendre(x,3,1)-3/2*(1-5*x^2)*(1-x^2)^(1/2)',
  '0',

  'legendre(x,3,2)-15*x*(1-x^2)',
  '0',

  'legendre(x,3,3)+15*(1-x^2)^(3/2)',
  '0',

  'legendre(x,4,0)-1/8*(35*x^4-30*x^2+3)',
  '0',

  'legendre(x,4,1)-5/2*x*(3-7*x^2)*(1-x^2)^(1/2)',
  '0',

  'legendre(x,4,2)-15/2*(7*x^2-1)*(1-x^2)',
  '0',

  'legendre(x,4,3)+105*x*(1-x^2)^(3/2)',
  '0',

  'legendre(x,4,4)-105*(1-x^2)^2',
  '0',

  'legendre(x,5,0)-1/8*x*(63*x^4-70*x^2+15)',
  '0',

  'legendre(cos(theta),0,0)-1',
  '0',

  'legendre(cos(theta),1,0)-cos(theta)',
  '0',

  'legendre(cos(theta),1,1)+abs(sin(theta))',
  '0',

  'legendre(cos(theta),2,0)-1/2*(3*cos(theta)^2-1)',
  '0',

  'legendre(cos(theta),2,1)+3*cos(theta)*abs(sin(theta))',
  '0',

  'legendre(cos(theta),2,2)-3*sin(theta)^2',
  '0',

  'legendre(cos(theta),3,0)-1/2*cos(theta)*(5*cos(theta)^2-3)',
  '0',

  'legendre(cos(theta),3,1)- (3/2*abs(sin(theta))-15/2*cos(theta)^2*abs(sin(theta)))',
  '0',

  'legendre(cos(theta),3,2)-15*cos(theta)*sin(theta)^2',
  '0',

  'legendre(cos(theta),3,3)+15*(sin(theta)^2)^(3/2)',
  '0',

  'legendre(a-b,10)-eval(subst(a-b,x,legendre(x,10)))',
  '0',

  // P_n(1) = 1, P_n(-1) = (-1)^n
  'legendre(1,5)',
  '1',

  'legendre(-1,5)',
  '-1',

  'legendre(0,4)',
  '3/8',

  'legendre(0.5,3)',
  '-0.4375',

  // m > n
  'legendre(x,2,3)',
  '0',

  // Legendre equation (1-x^2)*y'' - 2*x*y' + n*(n+1)*y = 0
  'y=legendre(x,5)',
  '',

  '(1-x^2)*d(y,x,2)-2*x*d(y,x)+30*y',
  '0',

  'y=quote(y)',
  '',

  // orthogonality on [-1,1], norm 2/(2*n+1)
  'defint(legendre(x,2)*legendre(x,3),x,-1,1)',
  '0',

  'defint(legendre(x,3)^2,x,-1,1)',
  '2/7',

  'defint(legendre(x,4)^2,x,-1,1)',
  '2/9',

  // negative orders stay unevaluated
  'legendre(x,-1)',
  'legendre(x,-1,0)',

  'legendre(x,2,-1)',
  'legendre(x,2,-1)',

  // tensors are not mapped over (x^2 would be a dot product)
  'legendre([x,1],2)',
  'legendre([x,1],2,0)',

  // wrong number of arguments
  'legendre(x,1,2,3)',
  'Stop: legendre: expected 2 to 3 arguments, got 4',
]);
