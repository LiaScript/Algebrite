import { run_test } from '../test-harness';

// laplace(f,t,s) / invlaplace(F,s,t): table plus linearity, shift theorems,
// multiplication by t^n and derivatives. Unknown forms stay unevaluated.
run_test([
  'laplace(1)',
  '1/s',

  'laplace(t)',
  '1/s^2',

  'laplace(t^3)',
  '6/(s^4)',

  'laplace(exp(2*t))',
  '1/(s-2)',

  'laplace(exp(-a*t))',
  '1/(s+a)',

  'laplace(sin(3*t))',
  '3/(s^2+9)',

  'laplace(cos(w*t))',
  's/(s^2+w^2)',

  'laplace(sinh(2*t))',
  '2/(s^2-4)',

  'laplace(cosh(t))',
  's/(s^2-1)',

  'laplace(3*t^2+5)',
  '6/(s^3)+5/s',

  'laplace(exp(-t)*t^2)',
  '2/((s+1)^3)',

  'laplace(exp(2*t)*cos(3*t))',
  '-2/(s^2-4*s+13)+s/(s^2-4*s+13)',

  'laplace(t*sin(t))',
  '2*s/((s^2+1)^2)',

  'laplace(sin(t+pi/2))',
  's/(s^2+1)',

  'laplace(heaviside(t-2))',
  'exp(-2*s)/s',

  'laplace(dirac(t-3))',
  'exp(-3*s)',

  'laplace(f(t),t,p)',
  'laplace(f(t),t,p)',

  'laplace(tan(t))',
  'laplace(tan(t),t,s)',

  'laplace(2*tan(t))',
  '2*laplace(tan(t),t,s)',

  'laplace(d(y(t),t))',
  's*laplace(y(t),t,s)-y(0)',

  'laplace(d(y(t),t,2))',
  '-at(d(y(t),t),t,0)-y(0)*s+s^2*laplace(y(t),t,s)',

  'invlaplace(1/s)',
  '1',

  'invlaplace(1/(s-2))',
  'exp(2*t)',

  'invlaplace(2/(s+1)^3)',
  't^2*exp(-t)',

  'invlaplace(1/(s^2+1))',
  'sin(t)',

  'invlaplace(s/(s^2+4))',
  'cos(2*t)',

  'invlaplace((s-2)/((s-2)^2+9))',
  'exp(2*t)*cos(3*t)',

  'invlaplace(1/(s^2+2*s+5))',
  '1/2*exp(-t)*sin(2*t)',

  'invlaplace(1/(s^2-2))',
  'sinh(2^(1/2)*t)/(2^(1/2))',

  'invlaplace(1/((s-1)*(s^2+1)))',
  '-1/2*cos(t)+1/2*exp(t)-1/2*sin(t)',

  'invlaplace((s+3)/(s^2+3*s+2))',
  '-exp(-2*t)+2*exp(-t)',

  'invlaplace(1/(s*(s+1)^2))',
  '1-exp(-t)-t*exp(-t)',

  // heaviside(t-2), printed via its definition
  'invlaplace(exp(-2*s)/s)',
  '1/2+1/2*sgn(t-2)',

  'invlaplace(3)',
  '3*dirac(t)',

  // repeated quadratic factors: derivative with respect to c of the
  // inverse of 1/(u^2+c)^(n-1)
  'invlaplace(1/(s^2+1)^2)',
  '1/2*sin(t)-1/2*t*cos(t)',

  'invlaplace(s/(s^2+4)^2)',
  '1/4*t*sin(2*t)',

  'invlaplace(1/(s^2+1)^3)',
  '3/8*sin(t)-3/8*t*cos(t)-1/8*t^2*sin(t)',

  'invlaplace(1/(s^2+2*s+5)^2)',
  '-1/8*t*exp(-t)*cos(2*t)+1/16*exp(-t)*sin(2*t)',

  'invlaplace(1/((s-1)*(s^2+1)^2))',
  '-1/4*cos(t)+1/4*exp(t)-1/2*sin(t)+1/4*t*cos(t)-1/4*t*sin(t)',

  'invlaplace(laplace(t^2*sin(t)))',
  't^2*sin(t)',

  'invlaplace(laplace(t*exp(-t)*sin(3*t)))',
  't*exp(-t)*sin(3*t)',

  // symbolic coefficients can't be factored, so this stays unevaluated
  'invlaplace(1/(s^2+a^2)^2)',
  'invlaplace(1/(s^4+2*a^2*s^2+a^4),s,t)',

  'invlaplace(laplace(sin(t)+t))',
  't+sin(t)',

  'invlaplace(laplace(t^2*exp(-t)))',
  't^2*exp(-t)',

  'invlaplace(laplace(exp(2*t)*cos(3*t)))',
  'exp(2*t)*cos(3*t)',

  'invlaplace(laplace(sinh(3*t)-4*cos(t)))',
  '-4*cos(t)-1/2*exp(-3*t)+1/2*exp(3*t)',

  // wrong number of arguments
  'laplace()',
  'Stop: laplace: expected 1 to 3 arguments, got 0',

  'invlaplace(1/s,s,t,x)',
  'Stop: invlaplace: expected 1 to 3 arguments, got 4',
]);
