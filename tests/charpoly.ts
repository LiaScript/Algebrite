import { run_test } from '../test-harness';

// charpoly(M, x) = det(M - x*identity(n)); roots are the eigenvalues.
run_test([
  'charpoly([[a,b],[c,d]],x)',
  'x^2+(-a-d)*x+a*d-b*c',

  'charpoly([[2,1],[1,2]],t)',
  't^2-4*t+3',

  'roots(charpoly([[2,1],[1,2]],t),t)',
  '[1,3]',

  // variable name of the caller may coincide with the parameter name
  'charpoly([[x,1],[1,x]],t)',
  '-1+t^2+x^2-2*t*x',

  'charpoly([[1,2,3],[4,5,6],[7,8,10]],x)',
  '-x^3+16*x^2+12*x-3',

  'charpoly(identity(3),x)',
  '-x^3+3*x^2-3*x+1',
]);
