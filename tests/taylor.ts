import { run_test } from '../test-harness';

run_test([
  'taylor(1/(5+4*cos(x)),x,6,0)-(1/9+2/81*x^2+5/1458*x^4+49/131220*x^6)',
  '0',

  'taylor(1/(5+4*cos(x)),x,6)-(1/9+2/81*x^2+5/1458*x^4+49/131220*x^6)',
  '0',

  'taylor(exp(x),x,4)',
  '1/24*x^4+1/6*x^3+1/2*x^2+x+1',

  'taylor(sin(x),x,5)',
  '1/120*x^5-1/6*x^3+x',

  'taylor(log(1+x),x,4)',
  '-1/4*x^4+1/3*x^3-1/2*x^2+x',

  'taylor(1/(1-x),x,3)',
  'x^3+x^2+x+1',

  'taylor(sqrt(1+x),x,3)',
  '1/16*x^3-1/8*x^2+1/2*x+1',

  'taylor(tan(x),x,5)',
  '2/15*x^5+1/3*x^3+x',

  'taylor(arctan(x),x,5)',
  '1/5*x^5-1/3*x^3+x',

  'taylor(exp(a*x),x,3)',
  '1/6*a^3*x^3+1/2*a^2*x^2+a*x+1',

  'taylor(exp(x)*y,x,2)',
  'y+x*y+1/2*x^2*y',

  // around a nonzero point, multiplied out: e*sum((x-1)^k/k!)
  'taylor(exp(x),x,4,1)',
  '1/24*e*x^4+1/4*e*x^2+1/3*e*x+3/8*e',

  // -1+(x-pi)^2/2-(x-pi)^4/24
  'taylor(cos(x),x,4,pi)',
  '-1/24*x^4+1/6*pi*x^3+(1/2-1/4*pi^2)*x^2+(-pi+1/6*pi^3)*x-1+1/2*pi^2-1/24*pi^4',

  // (x-1)-(x-1)^2/2+(x-1)^3/3
  'taylor(log(x),x,3,1)',
  '1/3*x^3-3/2*x^2+3*x-11/6',

  // 1-(x-1)+(x-1)^2-(x-1)^3
  'taylor(1/x,x,3,1)',
  '-x^3+4*x^2-6*x+4',

  // exp(a)*(1+(x-a)+(x-a)^2/2+(x-a)^3/6)
  'taylor(exp(x),x,3,a)',
  '1/6*exp(a)*x^3+(-1/2*a*exp(a)+1/2*exp(a))*x^2+(-a*exp(a)+exp(a)+1/2*a^2*exp(a))*x-a*exp(a)+exp(a)+1/2*a^2*exp(a)-1/6*a^3*exp(a)',

  // polynomials: exact from their degree on, truncated below it
  'taylor(x^3+2*x,x,5)',
  'x^3+2*x',

  'taylor(x^3+2*x,x,1)',
  '2*x',

  // 1+3*(x-1)+3*(x-1)^2
  'taylor(x^3,x,2,1)',
  '3*x^2-3*x+1',

  'taylor(5,x,3)',
  '5',

  'taylor(exp(x),x,0)',
  '1',

  'taylor([exp(x),sin(x)],x,2)',
  '[1+x+1/2*x^2,x]',

  // symbolic order
  'taylor(exp(x),x,n)',
  'taylor(exp(x),x,n,0)',

  // a pole: the Laurent series, see series_sums.ts
  'taylor(1/x,x,3)',
  '1/x',

  // a branch point has no such series
  'taylor(sqrt(x),x,2)',
  'Stop: divide by zero',

  // removable singularity: 1-x^2/6+x^4/120
  'taylor(sin(x)/x,x,4)',
  '1/120*x^4-1/6*x^2+1',

  // wrong number of arguments
  'taylor()',
  'Stop: taylor: expected 1 to 4 arguments, got 0',
]);

// derivatives of an unknown function at the expansion point (these came
// out as f(0) before subst treated the derivative variable as bound)
run_test([
  'taylor(f(x),x,1)',
  "f'(0)*x+f(0)",

  'taylor(f(x),x,2)',
  "1/2*f''(0)*x^2+f'(0)*x+f(0)",

  'taylor(f(x),x,1,2)',
  "f'(2)*x-2*f'(2)+f(2)",
]);
