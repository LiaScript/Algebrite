import { run_test } from '../test-harness';

run_test([
  // taylor at a removable singularity or a pole: the series of numerator and
  // denominator are divided, which also gives the Laurent terms

  // sin(x)/x = 1 - x^2/6 + x^4/120
  'taylor(sin(x)/x,x,4,0)',
  '1/120*x^4-1/6*x^2+1',

  // (cos(x)-1)/x^2 = -1/2 + x^2/24 - x^4/720
  'taylor((cos(x)-1)/x^2,x,4,0)',
  '-1/720*x^4+1/24*x^2-1/2',

  // log(1+x)/x = 1 - x/2 + x^2/3 - x^3/4
  'taylor(log(1+x)/x,x,3,0)',
  '-1/4*x^3+1/3*x^2-1/2*x+1',

  // x/(exp(x)-1) = sum B_n x^n/n! = 1 - x/2 + x^2/12 - x^4/720
  'taylor(x/(exp(x)-1),x,4,0)',
  '-1/720*x^4+1/12*x^2-1/2*x+1',

  // tan(x)/x = 1 + x^2/3 + 2*x^4/15
  'taylor(tan(x)/x,x,4,0)',
  '2/15*x^4+1/3*x^2+1',

  // exp(x)/x = 1/x + 1 + x/2 + x^2/6 + x^3/24
  'taylor(exp(x)/x,x,3,0)',
  '1+1/2*x+1/x+1/6*x^2+1/24*x^3',

  // 1/sin(x) = 1/x + x/6 + 7*x^3/360
  'taylor(1/sin(x),x,3,0)',
  '1/6*x+1/x+7/360*x^3',

  'taylor(1/x,x,3,0)',
  '1/x',

  'taylor(1/x^2,x,3,0)',
  '1/x^2',

  // 1/(x*(1-x)) = 1/x + 1 + x + x^2
  'taylor(1/(x*(1-x)),x,2,0)',
  '1+x+1/x+x^2',

  // a pole away from 0: 1/(x-1) around 1
  'taylor(1/(x-1),x,3,1)',
  '1/(x-1)',

  // (x^2-1)/(x-1) = x+1 around 1: 2 + (x-1)
  'taylor((x^2-1)/(x-1),x,3,1)',
  'x+1',

  // regular points are untouched
  'taylor(1/x,x,3,1)',
  '-x^3+4*x^2-6*x+4',

  // branch points and essential singularities have no such series
  'taylor(sqrt(x),x,2,0)',
  'Stop: divide by zero',

  'taylor(exp(1/x),x,2,0)',
  'Stop: divide by zero',

  // with other functions
  'eval(taylor(sin(x)/x,x,4,0),x,0)',
  '1',

  'integral(taylor(sin(x)/x,x,4,0),x)',
  '1/600*x^5-1/18*x^3+x',

  'limit(taylor(sin(x)/x,x,4,0),x,0)',
  '1',

  // infinite geometric series: t(a)/(1-r) for abs(r) < 1
  'sum(1/2^k,k,0,inf)',
  '2',

  'sum(1/2^k,k,1,inf)',
  '1',

  'sum((1/3)^k,k,0,inf)',
  '3/2',

  'sum(3*(1/2)^k,k,0,inf)',
  '6',

  'sum((-1/2)^k,k,0,inf)',
  '2/3',

  // the formal sum, as in other CAS, valid for abs(x) < 1
  'sum(x^k,k,0,inf)',
  '1/(-x+1)',

  'sum(2^k,k,0,inf)',
  'Stop: sum: the series diverges',

  'sum(k,k,1,inf)',
  'Stop: sum: the series diverges',

  'sum(1,k,1,inf)',
  'Stop: sum: the series diverges',

  // p-series: zeta(2) = pi^2/6, zeta(4) = pi^4/90, zeta(6) = pi^6/945
  'sum(1/k^2,k,1,inf)',
  '1/6*pi^2',

  'sum(1/k^4,k,1,inf)',
  '1/90*pi^4',

  'sum(1/k^6,k,1,inf)',
  '1/945*pi^6',

  'sum(3/k^2,k,1,inf)',
  '1/2*pi^2',

  'sum(1/k^2,k,2,inf)',
  '-1+1/6*pi^2',

  // 1 + 1/4 = 5/4 is left out
  'sum(1/k^2,k,3,inf)',
  '-5/4+1/6*pi^2',

  'sum(1/k^3,k,1,inf)',
  'zeta(3)',

  'sum(1/k,k,1,inf)',
  'Stop: sum: the series diverges',

  // 1.6449340668...
  'float(sum(1/k^2,k,1,inf))',
  '1.644934...',

  // exponential series: sum c*r^k/k! = c*exp(r)
  'sum(x^k/k!,k,0,inf)',
  'exp(x)',

  'sum(1/k!,k,0,inf)',
  'e',

  'sum(2^k/k!,k,0,inf)',
  'exp(2)',

  'sum(x^k/k!,k,1,inf)',
  '-1+exp(x)',

  // the k = 0 and k = 1 terms are 1 and x
  'sum(x^k/k!,k,2,inf)',
  '-1-x+exp(x)',

  'd(sum(x^k/k!,k,0,inf),x)',
  'exp(x)',

  // terms of different kinds
  'sum(1/k^2+1/2^k,k,1,inf)',
  '1+1/6*pi^2',

  // finite sums are as before
  'sum(k,k,1,n)',
  '1/2*n+1/2*n^2',

  'sum(1/2^k,k,0,3)',
  '15/8',

  // unknown summands stay
  'sum(sin(k)/k,k,1,inf)',
  'sum(sin(k)/k,k,1,inf)',

  // symbolic products: constants, the index, shifts and powers
  'product(k,k,1,n)',
  'n!',

  'product(2*k,k,1,n)',
  '2^n*n!',

  'product(k^2,k,1,n)',
  'n!^2',

  'product(k+1,k,1,n)',
  '(1+n)!',

  'product(x,k,1,n)',
  'x^n',

  // 3*4*...*n = n!/2
  'product(k,k,3,n)',
  '1/2*n!',

  'product(1/k,k,1,n)',
  '1/(n!)',

  'product(k,k,1,5)',
  '120',

  // (n+1)!/n! after simplification
  'simplify(product(k,k,1,n+1)/product(k,k,1,n))',
  '1+n',

  'product(sin(k),k,1,n)',
  'product(sin(k),k,1,n)',
]);
