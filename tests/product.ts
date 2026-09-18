import { run_test } from '../test-harness';

run_test([
  // compute pi using Viete's formula ------------

  // note that this is not an array, this
  // defines a recursive function
  'a(n)=test(n=0,0,sqrt(2+a(n-1)))',
  '',

  // not very efficient because evaluation of
  // a(n) is not memoized, so there
  // is quadratic cost as n increases.
  'float(2*product(2/a(k),k,1,9))',
  '3.141588...',

  // Wallis' product
  '2*product(float(4*k^2/(4*k^2-1)),k,1,100)',
  '3.133787...',

  // ---------------------------
  'f(a,b)=product(k,k,a,b)',
  '',

  'f(1,2)',
  '2',

  // --- cleanup

  'a = quote(a)',
  '',

  'f = quote(f)',
  '',

  'product(k,k,1,5)',
  '120',

  'product(k,k,3,3)',
  '3',

  'product(k,k,-2,2)',
  '0',

  // (x-1)*(x-2)*(x-3)
  'product(x-k,k,1,3)',
  'x^3-6*x^2+11*x-6',

  // telescoping: (k+1)/k
  'product(1+1/k,k,1,9)',
  '10',

  // empty ranges (upper < lower) give 1
  'product(k,k,5,1)',
  '1',

  'product(k,k,4,3)',
  '1',

  // symbolic bounds have closed forms (see series_sums.ts), non-integer
  // numeric bounds stay unevaluated
  'product(k,k,1,n)',
  'n!',

  'product(x,k,1,n)',
  'x^n',

  'product(k,k,1/2,3)',
  'product(k,k,1/2,3)',

  // the index must be a symbol
  'product(k,1,1,3)',
  'Stop: product: 2nd arg?',

  // wrong number of arguments
  'product(k,k,1)',
  'Stop: product: expected 4 arguments, got 3',
]);
