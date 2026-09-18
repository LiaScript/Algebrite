import { run_test } from '../test-harness';

// chk(F) is 1 when d/dx integral(F) - F vanishes numerically at x = 7/10
run_test([
  'chk(F)=abs(float(eval(d(integral(F,x),x)-F,x,7/10)))<10^(-9)',
  '',

  // exp with sinh or cosh: the hyperbolic function is written in exp
  // exp(x)*sinh(x) = (exp(2*x)-1)/2
  'integral(exp(x)*sinh(x),x)',
  '-1/2*x+1/4*exp(2*x)',

  'integral(exp(x)*cosh(x),x)',
  '1/2*x+1/4*exp(2*x)',

  'chk(exp(2*x)*sinh(3*x))',
  '1',

  // 1/(a+b*cos(x)) and 1/(a+b*sin(x)) with a^2 > b^2: the real arctan form
  // 2/sqrt(a^2-b^2)*arctan(sqrt((a-b)/(a+b))*tan(x/2))
  'integral(1/(2+cos(x)),x)',
  '2*arctan(tan(1/2*x)/(3^(1/2)))/(3^(1/2))',

  'chk(1/(2+cos(x)))',
  '1',

  'chk(1/(5+3*sin(x)))',
  '1',

  'chk(1/(5-4*cos(x)))',
  '1',

  // 1/(x^4+c), c > 0. integral from 0 to inf of 1/(1+x^4) = pi/(2*sqrt(2))
  'chk(1/(1+x^4))',
  '1',

  'chk(1/(x^4+16))',
  '1',

  'chk(3/(2*x^4+5))',
  '1',

  'float(defint(1/(1+x^4),x,0,inf))',
  '1.110721...',

  // telescoping sums: partial fractions whose poles differ by integers
  // 1/(k*(k+1)) = 1/k - 1/(k+1)
  'sum(1/(k*(k+1)),k,1,inf)',
  '1',

  'sum(1/(k*(k+1)),k,1,n)',
  '1-1/(1+n)',

  'sum(1/(k*(k+1)),k,1,10)',
  '10/11',

  // (1/2)*(1/k - 1/(k+2)): 1/2*(1+1/2)
  'sum(1/(k*(k+2)),k,1,inf)',
  '3/4',

  'sum(1/(k^2-1),k,2,inf)',
  '3/4',

  // (1/2)*(1/(2*k-1) - 1/(2*k+1))
  'sum(1/((2*k-1)*(2*k+1)),k,1,inf)',
  '1/2',

  // 1/2*(1/(k*(k+1)) - 1/((k+1)*(k+2))): 1/2*1/2
  'sum(1/(k*(k+1)*(k+2)),k,1,inf)',
  '1/4',

  'sum(1/(k+1),k,1,inf)',
  'Stop: sum: the series diverges',

  // alternating p-series: sum (-1)^k/k^s = -(1-2^(1-s))*zeta(s), -log(2) at s = 1
  'sum((-1)^k/k,k,1,inf)',
  '-log(2)',

  'sum((-1)^(k+1)/k,k,1,inf)',
  'log(2)',

  'sum((-1)^k/k^2,k,1,inf)',
  '-1/12*pi^2',

  'sum((-1)^(k+1)/k^2,k,1,inf)',
  '1/12*pi^2',

  // -1 + 1/2 is left out: -log(2) + 1/2
  'sum((-1)^k/k,k,3,inf)',
  '1/2-log(2)',

  // systems of inequalities: the intersection
  'solve([x>1,x<3],x)',
  'and(x>1,x<3)',

  'solve([x^2>1,x<5],x)',
  'or(x<-1,and(x>1,x<5))',

  'solve([x>3,x<1],x)',
  '0',

  'solve([x^2<4,x>=0],x)',
  'and(x>=0,x<2)',

  // linear in x with a coefficient of known sign
  'solve(x>a,x)',
  'x>a',

  'solve(2*x+a<=b,x)',
  'x<=1/2*(-a+b)',

  'assume(a,positive)',
  '',

  'solve(a*x>b,x)',
  'x>b/a',

  'forget(a)',
  '',

  'assume(a,negative)',
  '',

  'solve(a*x>b,x)',
  'x<b/a',

  'forget(a)',
  '',

  'solve(a*x>b,x)',
  'Stop: solve: inequalities with parameters are not supported',

  // trig equations: a third argument names the integer of the solution family
  'solve(sin(x)=1/2,x,n)',
  '[1/6*pi+2*n*pi,5/6*pi+2*n*pi]',

  'solve(cos(x)=0,x,n)',
  '[1/2*pi+2*n*pi,-1/2*pi+2*n*pi]',

  'solve(tan(x)=1,x,n)',
  '1/4*pi+n*pi',

  // 2*x = pi/2 + 2*n*pi
  'solve(sin(2*x)=1,x,n)',
  '1/4*pi+n*pi',

  // the family holds once n is known to be an integer
  'assume(n,integer)',
  '',

  'sin(1/6*pi+2*n*pi)',
  '1/2',

  'forget(n)',
  '',

  // without it the principal solutions, as before
  'solve(sin(x)=1/2,x)',
  '[1/6*pi,5/6*pi]',

  'solve(x^2=4,x,n)',
  '[-2,2]',

  // a*sin(g) + b*cos(g) = 0 is tan(g) = -b/a
  'solve(sin(x)=cos(x),x)',
  '1/4*pi',

  'solve(sin(x)+cos(x)=0,x)',
  '-1/4*pi',

  'solve(sin(x)=cos(x),x,n)',
  '1/4*pi+n*pi',

  // sqrt(3)*sin(x) = cos(x): tan(x) = 1/sqrt(3)
  'solve(sqrt(3)*sin(x)=cos(x),x)',
  '1/6*pi',
]);
