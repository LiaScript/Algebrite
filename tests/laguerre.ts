import { run_test } from '../test-harness';

run_test([
  'laguerre(x,n)',
  'laguerre(x,n,0)',

  'laguerre(x,n,k)',
  'laguerre(x,n,k)',

  'laguerre(x,0)-1',
  '0',

  'laguerre(x,1)-(-x+1)',
  '0',

  'laguerre(x,2)-1/2*(x^2-4*x+2)',
  '0',

  'laguerre(x,3)-1/6*(-x^3+9*x^2-18*x+6)',
  '0',

  'laguerre(x,0,k)-1',
  '0',

  'laguerre(x,1,k)-(-x+k+1)',
  '0',

  'laguerre(x,2,k)-1/2*(x^2-2*(k+2)*x+(k+1)*(k+2))',
  '0',

  'laguerre(x,3,k)-1/6*(-x^3+3*(k+3)*x^2-3*(k+2)*(k+3)*x+(k+1)*(k+2)*(k+3))',
  '0',

  'laguerre(a-b,10)-eval(subst(a-b,x,laguerre(x,10)))',
  '0',

  // L_n(0) = 1, L_n^k(0) = binomial(n+k,n)
  'laguerre(0,3)',
  '1',

  'laguerre(0,3,2)',
  '10',

  'laguerre(1,2)',
  '-1/2',

  'laguerre(2.0,2)',
  '-1.0',

  // non-integer and negative k
  'laguerre(x,2,1/2)',
  '1/2*x^2-5/2*x+15/8',

  'laguerre(x,2,-1)',
  '1/2*x^2-x',

  // Laguerre equation x*y'' + (k+1-x)*y' + n*y = 0
  'y=laguerre(x,4)',
  '',

  'x*d(y,x,2)+(1-x)*d(y,x)+4*y',
  '0',

  'y=laguerre(x,3,2)',
  '',

  'x*d(y,x,2)+(3-x)*d(y,x)+3*y',
  '0',

  'y=quote(y)',
  '',

  // negative or non-integer orders stay unevaluated
  'laguerre(x,-1)',
  'laguerre(x,-1,0)',

  'laguerre(x,1/2)',
  'laguerre(x,1/2,0)',

  // tensors are not mapped over (x^2 would be a dot product)
  'laguerre([x,1],2)',
  'laguerre([x,1],2,0)',

  // wrong number of arguments
  'laguerre(x)',
  'Stop: laguerre: expected 2 to 3 arguments, got 1',
]);
