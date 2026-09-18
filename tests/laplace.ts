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
  "-y'(0)-y(0)*s+s^2*laplace(y(t),t,s)",

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

  // s^4+2*a^2*s^2+a^4 = (s^2+a^2)^2 is factored now (it stayed unevaluated
  // before). (sin(b*t)-b*t*cos(b*t))/(2*b^3) with b = abs(a); the value is
  // even in a, so abs(a) is right for either sign
  'invlaplace(1/(s^2+a^2)^2)',
  '-t*cos(abs(a)*t)/(2*a^2)+sin(abs(a)*t)/(2*(a^2)^(3/2))',

  // transformed back it is the input
  'assume(a,positive)',
  '',

  'simplify(laplace(invlaplace(1/(s^2+a^2)^2))-1/(s^2+a^2)^2)',
  '0',

  'forget(a)',
  '',

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

  // ------------------------------------------------ laplace edge cases

  'laplace(0)',
  '0',

  // explicit variables
  'laplace(t,t)',
  '1/s^2',

  'laplace(x^2,x,p)',
  '2/(p^3)',

  'laplace(t^10)',
  '3628800/(s^11)',

  // a constant factor -1 is pulled out like any other constant
  'laplace(-tan(t))',
  '-laplace(tan(t),t,s)',

  // shifted arguments: exp(c), sin(c), cos(c) of the offset c
  'laplace(exp(2*t+1))',
  'e/(s-2)',

  'laplace(sin(2*t+1))',
  's*sin(1)/(s^2+4)+2*cos(1)/(s^2+4)',

  'laplace(cos(2*t-1))',
  's*cos(1)/(s^2+4)+2*sin(1)/(s^2+4)',

  'laplace(cosh(3*t+2))',
  's*cosh(2)/(s^2-9)+3*sinh(2)/(s^2-9)',

  'laplace(sin(a*t+b))',
  'a*cos(b)/(s^2+a^2)+s*sin(b)/(s^2+a^2)',

  'laplace(exp(i*t))',
  '1/(s-i)',

  // steps and impulses
  'laplace(sgn(t))',
  '1/s',

  'laplace(dirac(t))',
  '1',

  'laplace(heaviside(2*t-4))',
  'exp(-2*s)/s',

  'laplace(dirac(2*t-4))',
  '1/2*exp(-2*s)',

  // the delay a is assumed to be >= 0
  'laplace(heaviside(t-a))',
  'exp(-a*s)/s',

  // an impulse before t = 0 is not covered by the table
  'laplace(dirac(t+3))',
  'laplace(dirac(t+3),t,s)',

  'laplace(exp(-t)*heaviside(t-1))',
  'exp(-s-1)/(s+1)',

  // t*H(t-2) = (t-2)*H(t-2) + 2*H(t-2)
  'laplace(t*heaviside(t-2))',
  'exp(-2*s)/(s^2)+2*exp(-2*s)/s',

  // (s^2+2*s)/(s^2+2*s+2)^2, i.e. L{t*cos(t)} shifted to s+1
  'laplace(t*exp(-t)*cos(t))',
  '2/((s^2+2*s+2)^2)-1/(s^2+2*s+2)+4*s/((s^2+2*s+2)^2)+2*s^2/((s^2+2*s+2)^2)',

  // (2*s^3+6*s)/(s^2-1)^3
  'laplace(t^2*cosh(t))',
  '-6*s/((s^2-1)^2)+8*s^3/((s^2-1)^3)',

  'laplace(d(y(t),t,3))',
  "-y''(0)-y'(0)*s-y(0)*s^2+s^3*laplace(y(t),t,s)",

  'laplace(d(y(t),t)+y(t))',
  'laplace(y(t),t,s)+s*laplace(y(t),t,s)-y(0)',

  'laplace(exp(-t)*d(y(t),t))',
  'laplace(y(t),t,s+1)+s*laplace(y(t),t,s+1)-y(0)',

  // multiplication by t of an unknown transform
  'laplace(t*log(t))',
  '-d(laplace(log(t),t,s),s)',

  // no transform (1/t, exp(t^2)) or not in the table: unevaluated
  'laplace(1/t)',
  'laplace(1/t,t,s)',

  'laplace(exp(t^2))',
  'laplace(exp(t^2),t,s)',

  'laplace(sqrt(t))',
  'laplace(t^(1/2),t,s)',

  // --------------------------------------------- invlaplace edge cases

  'invlaplace(0)',
  '0',

  'invlaplace(1/s^5)',
  '1/24*t^4',

  'invlaplace(1/(2*s+1))',
  '1/2*exp(-1/2*t)',

  'invlaplace(1/(2*s+1)^2)',
  '1/4*t*exp(-1/2*t)',

  'invlaplace(1/(2*s^2+2*s+1))',
  'exp(-1/2*t)*sin(1/2*t)',

  // s/(s+1)^2 = 1/(s+1) - 1/(s+1)^2
  'invlaplace(s/(s^2+2*s+1))',
  'exp(-t)-t*exp(-t)',

  'invlaplace(1/(s^2-2*s-3))',
  '-1/4*exp(-t)+1/4*exp(3*t)',

  'invlaplace(1/(s^2*(s^2+1)))',
  't-sin(t)',

  'invlaplace(1/(s^4-1))',
  '1/4*exp(t)-1/4*exp(-t)-1/2*sin(t)',

  'invlaplace(1/(s^3+1))',
  '1/3*exp(-t)+exp(1/2*t)*sin(1/2*3^(1/2)*t)/(3^(1/2))-1/3*exp(1/2*t)*cos(1/2*3^(1/2)*t)',

  // ((15-6*t^2)*sin(t)-(15*t-t^3)*cos(t))/48
  'invlaplace(1/(s^2+1)^4)',
  '5/16*sin(t)-5/16*t*cos(t)-1/8*t^2*sin(t)+1/48*t^3*cos(t)',

  'invlaplace(1/((s^2+1)*(s^2+4)))',
  '1/3*sin(t)-1/6*sin(2*t)',

  'invlaplace(s^3/(s^2+1)^2)',
  'cos(t)-1/2*t*sin(t)',

  // symbolic coefficients
  'invlaplace(1/(s^2+w^2))',
  'sin(abs(w)*t)/abs(w)',

  'invlaplace(s/(s^2+w^2))',
  'cos(abs(w)*t)',

  'invlaplace(1/(s^2+a))',
  'sin(a^(1/2)*t)/(a^(1/2))',

  'invlaplace(1/(s+a))',
  'exp(-a*t)',

  'invlaplace(1/(s-a)^2)',
  't*exp(a*t)',

  'invlaplace(1/(s^2-a^2))',
  '-exp(-a*t)/(2*a)+exp(a*t)/(2*a)',

  // explicit variables
  'invlaplace(1/(s-2),s,x)',
  'exp(2*x)',

  'invlaplace(1/(p+1),p,x)',
  'exp(-x)',

  // improper fractions: the polynomial part is an impulse
  'invlaplace(s/(s+1))',
  'dirac(t)-exp(-t)',

  'invlaplace(s^2/(s^2+1))',
  'dirac(t)-sin(t)',

  // delays
  'invlaplace(exp(-a*s)/s)',
  '1/2+1/2*sgn(t-a)',

  'invlaplace(exp(-2*s+1)/s)',
  '1/2*e+1/2*e*sgn(t-2)',

  'invlaplace(exp(-s)*exp(-2*s)/s)',
  '1/2+1/2*sgn(t-3)',

  // (t-2)*heaviside(t-2)
  'invlaplace(exp(-2*s)/s^2)',
  '-1+1/2*t-sgn(t-2)+1/2*t*sgn(t-2)',

  'invlaplace(exp(-s)/(s+1))',
  '1/2*exp(-t+1)+1/2*exp(-t+1)*sgn(t-1)',

  // 1 - heaviside(t-1)
  'invlaplace((1-exp(-s))/s)',
  '1/2-1/2*sgn(t-1)',

  // a delayed impulse is not multiplied by the step (that would halve it)
  'invlaplace(exp(-s))',
  'dirac(-t+1)',

  'invlaplace(3*exp(-2*s))',
  '3*dirac(-t+2)',

  'invlaplace(exp(-s)*(1+1/s))',
  '1/2+dirac(-t+1)+1/2*sgn(t-1)',

  // exp(2*s)/s would be a step at t = -2, which is not causal
  'invlaplace(exp(2*s)/s)',
  'invlaplace(exp(2*s)/s,s,t)',

  // no inverse in the table: unevaluated
  'invlaplace(1/s^(1/2))',
  'invlaplace(1/s^(1/2),s,t)',

  'invlaplace(log(s))',
  'invlaplace(log(s),s,t)',

  'invlaplace(F(s))',
  'invlaplace(F(s),s,t)',
]);

// Solving linear ODEs: transform, insert the initial values y(0) and y'(0),
// solve for Y = laplace(y(t),t,s), transform back
run_test([
  "L=subst(1,y'(0),subst(0,y(0),laplace(d(y(t),t,2)+y(t))))",
  '',

  'invlaplace(solve(subst(Y,laplace(y(t),t,s),L),Y))',
  'sin(t)',

  'L=subst(2,y(0),laplace(d(y(t),t)+3*y(t)))',
  '',

  'invlaplace(solve(subst(Y,laplace(y(t),t,s),L),Y))',
  '2*exp(-3*t)',

  "L=subst(0,y'(0),subst(1,y(0),laplace(d(y(t),t,2)+2*d(y(t),t)+5*y(t))))",
  '',

  'invlaplace(solve(subst(Y,laplace(y(t),t,s),L),Y))',
  'exp(-t)*cos(2*t)+1/2*exp(-t)*sin(2*t)',
]);
