import { run_test } from '../test-harness';

run_test([
  'laguerre(n,x)',
  'laguerre(n,0,x)',

  'laguerre(n,k,x)',
  'laguerre(n,k,x)',

  'laguerre(0,x)-1',
  '0',

  'laguerre(1,x)-(-x+1)',
  '0',

  'laguerre(2,x)-1/2*(x^2-4*x+2)',
  '0',

  'laguerre(3,x)-1/6*(-x^3+9*x^2-18*x+6)',
  '0',

  'laguerre(0,k,x)-1',
  '0',

  'laguerre(1,k,x)-(-x+k+1)',
  '0',

  'laguerre(2,k,x)-1/2*(x^2-2*(k+2)*x+(k+1)*(k+2))',
  '0',

  'laguerre(3,k,x)-1/6*(-x^3+3*(k+3)*x^2-3*(k+2)*(k+3)*x+(k+1)*(k+2)*(k+3))',
  '0',

  'laguerre(10,a-b)-eval(subst(a-b,x,laguerre(10,x)))',
  '0',

  // L_n(0) = 1, L_n^k(0) = binomial(n+k,n)
  'laguerre(3,0)',
  '1',

  'laguerre(3,2,0)',
  '10',

  'laguerre(2,1)',
  '-1/2',

  'laguerre(2,2.0)',
  '-1.0',

  // non-integer and negative k
  'laguerre(2,1/2,x)',
  '1/2*x^2-5/2*x+15/8',

  'laguerre(2,-1,x)',
  '1/2*x^2-x',

  // Laguerre equation x*y'' + (k+1-x)*y' + n*y = 0
  'y=laguerre(4,x)',
  '',

  'x*d(y,x,2)+(1-x)*d(y,x)+4*y',
  '0',

  'y=laguerre(3,2,x)',
  '',

  'x*d(y,x,2)+(3-x)*d(y,x)+3*y',
  '0',

  'y=quote(y)',
  '',

  // negative or non-integer orders stay unevaluated
  'laguerre(-1,x)',
  'laguerre(-1,0,x)',

  'laguerre(1/2,x)',
  'laguerre(1/2,0,x)',

  // tensors are not mapped over (x^2 would be a dot product)
  'laguerre(2,[x,1])',
  'laguerre(2,0,[x,1])',

  // wrong number of arguments
  'laguerre(x)',
  'Stop: laguerre: expected 2 to 3 arguments, got 1',
]);
