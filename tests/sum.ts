import { run_test } from '../test-harness';

run_test([
  // symbolic bounds with a non-polynomial summand stay unevaluated
  'sum(1/k,k,b,c)',
  'sum(1/k,k,b,c)',

  'sum(2^k,k,0,n)',
  'sum(2^k,k,0,n)',

  // polynomial summands get a closed form (Faulhaber) for symbolic bounds;
  // the result is in expanded form, factor() gives the textbook shape
  'sum(k,k,1,n)',
  '1/2*n+1/2*n^2',

  'factor(sum(k,k,1,n),n)',
  '1/2*n*(1+n)',

  'sum(k^2,k,1,n)',
  '1/6*n+1/2*n^2+1/3*n^3',

  'factor(sum(k^2,k,1,n),n)',
  '1/6*n*(1+n)*(1+2*n)',

  'sum(k^3,k,1,n)',
  '1/4*n^2+1/2*n^3+1/4*n^4',

  'sum(k,k,0,n)',
  '1/2*n+1/2*n^2',

  'sum(k,k,3,n)',
  '-3+1/2*n+1/2*n^2',

  'sum(k,k,m,n)',
  '1/2*m+1/2*n-1/2*m^2+1/2*n^2',

  'sum(k,k,1,2*n)',
  'n+2*n^2',

  'sum(c,k,1,n)',
  'c*n',

  'sum(a*k+b,k,1,n)',
  '1/2*a*n+1/2*a*n^2+b*n',

  'sum((k+1)^2,k,1,n)',
  '13/6*n+3/2*n^2+1/3*n^3',

  'sum(body + k,k,b,c)',
  '1/2*b+body+1/2*c-b*body+body*c-1/2*b^2+1/2*c^2',

  'eval(sum(k^2,k,1,n),n,10)',
  '385',

  // a bound index variable does not leak into the closed form
  'k=7',
  '',

  'sum(k,k,1,n)',
  '1/2*n+1/2*n^2',

  'k',
  '7',

  'k=quote(k)',
  '',

  'f=sum(a^k,k,0,9)',
  '',

  'eval(f,a,-1/2)',
  '341/512',

  // Leibniz formula for π as a series
  'sum(float((-1)^k * (1/(2*k + 1))),k,0,100)*4',
  '3.151493...',

  // -------------------

  'f(a,b)=sum(k,k,a,b)',
  '',

  'f(0,1)',
  '1',

  // --- cleanup

  'f = quote(f)',
  '',
]);
