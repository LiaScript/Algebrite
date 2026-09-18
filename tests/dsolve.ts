import { run_test } from '../test-harness';

// dsolve(ode, y(x)) returns y(x) with constants C1, C2, ...; every result
// was checked by substituting it back into the equation and the initial
// conditions.

// first order linear, integrating factor
run_test([
  'dsolve(d(y(x),x)=a*y(x),y(x))',
  'C1*exp(a*x)',

  "dsolve(y'(x)=y(x),y(x))",
  'C1*exp(x)',

  'dsolve(d(y(x),x)+2*y(x)=x,y(x))',
  '-1/4+1/2*x+C1*exp(-2*x)',

  // integrating factor exp(log|x|) = x
  'dsolve(d(y(x),x)+y(x)/x=x^2,y(x))',
  'C1/x+1/4*x^3',

  'dsolve(d(y(x),x)=-2*x*y(x),y(x),[y(0)=1])',
  'exp(-x^2)',
]);

// separable
run_test([
  'dsolve(d(y(x),x)=x*y(x)^2,y(x))',
  '2/(-x^2-2*C1)',

  'dsolve(d(y(x),x)=y(x)^2,y(x))',
  '-1/(x+C1)',

  // two branches
  'dsolve(d(y(x),x)=x/y(x),y(x))',
  '[-(2*C1+x^2)^(1/2),(2*C1+x^2)^(1/2)]',

  // the initial value picks the branch
  'dsolve(d(y(x),x)=x/y(x),y(x),[y(0)=1])',
  '(x^2+1)^(1/2)',

  'dsolve(d(y(x),x)=x*(1+y(x)^2),y(x))',
  'tan(1/2*x^2+C1)',

  'dsolve(d(y(x),x)=1+y(x)^2,y(x),[y(0)=0])',
  'tan(x)',

  // logistic, log|y| - log|y-1| = x + C
  'dsolve(d(y(x),x)=y(x)*(1-y(x)),y(x))',
  'C1*exp(x)/(-1+C1*exp(x))',

  'dsolve(d(y(x),x)+y(x)=y(x)^2,y(x),[y(0)=2])',
  '-2/(-2+exp(x))',

  'dsolve(d(y(x),x)=exp(y(x))*x,y(x))',
  'Stop: dsolve: can only give the implicit solution -1/2*x^2-exp(-y(x)) = C1',
]);

// Bernoulli, not separable
run_test([
  'dsolve(d(y(x),x)+y(x)/x=y(x)^2,y(x))',
  '1/(C1*x-x*log(x))',
]);

// linear with constant coefficients
run_test([
  'dsolve(d(y(x),x,2)+3*d(y(x),x)+2*y(x)=0,y(x))',
  'C1*exp(-2*x)+C2*exp(-x)',

  // double root
  'dsolve(d(y(x),x,2)+2*d(y(x),x)+y(x)=0,y(x))',
  'C1*exp(-x)+C2*x*exp(-x)',

  'dsolve(d(y(x),x,2)+y(x)=0,y(x))',
  'C1*cos(x)+C2*sin(x)',

  'dsolve(d(y(x),x,2)+2*d(y(x),x)+5*y(x)=0,y(x))',
  'C1*exp(-x)*cos(2*x)+C2*exp(-x)*sin(2*x)',

  'dsolve(d(y(x),x,3)-y(x)=0,y(x))',
  'C1*exp(x)+C2*exp(-1/2*x)*cos(1/2*3^(1/2)*x)+C3*exp(-1/2*x)*sin(1/2*3^(1/2)*x)',

  // double complex pair
  'dsolve(d(y(x),x,4)+2*d(y(x),x,2)+y(x)=0,y(x))',
  'C1*cos(x)+C2*sin(x)+C3*x*cos(x)+C4*x*sin(x)',

  // particular solution; its exp(x) part goes into C2
  'dsolve(d(y(x),x,2)+y(x)=x,y(x))',
  'x+C1*cos(x)+C2*sin(x)',

  'dsolve(d(y(x),x,2)-y(x)=exp(2*x),y(x))',
  'C1*exp(-x)+C2*exp(x)+1/3*exp(2*x)',

  'dsolve(d(y(x),x,2)+y(x)=0,y(x),[y(0)=1,y\'(0)=0])',
  'cos(x)',

  'dsolve(d(y(x),x,2)-2*d(y(x),x)+y(x)=x*exp(x),y(x),[y(0)=0,y\'(0)=1])',
  'x*exp(x)*(1/6*x^2+1)',

  // a of unknown sign: complex exponentials
  'dsolve(d(y(x),x,2)+a*y(x)=0,y(x))',
  'C1*exp(-i*a^(1/2)*x)+C2*exp(i*a^(1/2)*x)',

  'assume(a,positive)',
  '',

  'dsolve(d(y(x),x,2)+a*y(x)=0,y(x))',
  'C1*cos(a^(1/2)*x)+C2*sin(a^(1/2)*x)',
]);

// the equation is not taken as a definition of y
run_test([
  'r=dsolve(d(y(x),x)=y(x),y(x))',
  '',

  'y(2)',
  'y(2)',
]);

run_test([
  'dsolve(d(y(x),x,2)=y(x)*d(y(x),x),y(x))',
  'Stop: dsolve: only separable, first-order linear, Bernoulli or linear equations with constant coefficients are supported',

  'dsolve(x^2,y(x))',
  'Stop: dsolve: 1st argument has no derivative of y(x)',

  'dsolve(d(y(x),x)=y(x),y)',
  'Stop: dsolve: 2nd argument must be a function call like y(x)',
]);
