import { run_test } from '../test-harness';

// What integral() does when the table and partial fractions fail:
// exp(a*x)*sin(b*x) formulas, abs of a linear argument, 1/(quadratic with
// real roots), u-substitution (F = h(g)*g'), integration by parts (LIATE),
// tan^2 = 1/cos^2-1 and odd trig powers via sin/cos substitution.
// chk(F) is 1 when d/dx integral(F) - F vanishes numerically at x = 7/10:
// used where the exact printed form is not worth pinning down. The value is
// made a float before abs: the exact abs of a constant with nested radicals
// (1/(2*x^4+5)) can overflow the stack in numerator/rationalize.
run_test([
  'chk(F)=abs(float(eval(d(integral(F,x),x)-F,x,7/10)))<10^(-9)',
  '',

  // u-substitution
  'integral(x*cos(x^2),x)',
  '1/2*sin(x^2)',

  'integral(2*x*cos(x^2),x)',
  'sin(x^2)',

  'integral(log(x)/x,x)',
  '1/2*log(x)^2',

  'integral(3*log(x)/x,x)',
  '3/2*log(x)^2',

  'integral(x/(x^2+1)^2,x)',
  '-1/(2*(x^2+1))',

  'integral(exp(x)/(exp(x)+1),x)',
  'log(1+exp(x))',

  // d/dx: exp(-x)/(1+exp(-x)) = 1/(exp(x)+1)
  'integral(1/(exp(x)+1),x)',
  '-log(1+exp(-x))',

  'integral(sinh(x)*cosh(x),x)',
  '1/2*cosh(x)^2',

  'integral(cos(x)/(1+sin(x)),x)',
  'log(abs(1+sin(x)))',

  // u = sin(x), cos^2 = 1-u^2
  'integral(sin(x)^2*cos(x)^3,x)',
  '1/3*sin(x)^3-1/5*sin(x)^5',

  'integral(cos(x)^5,x)',
  '-2/3*sin(x)^3+1/5*sin(x)^5+sin(x)',

  // u = sqrt(x), then by parts
  'integral(exp(sqrt(x)),x)',
  '-2*exp(x^(1/2))+2*x^(1/2)*exp(x^(1/2))',

  'integral(sin(sqrt(x)),x)',
  '2*sin(x^(1/2))-2*x^(1/2)*cos(x^(1/2))',

  // u = x^2, then by parts
  'integral(x^3*exp(x^2),x)',
  '-1/2*exp(x^2)+1/2*x^2*exp(x^2)',

  // exp(a*x)*trig(b*x)
  'integral(exp(x)*sin(x),x)',
  '-1/2*exp(x)*cos(x)+1/2*exp(x)*sin(x)',

  'integral(exp(x)*cos(x),x)',
  '1/2*exp(x)*cos(x)+1/2*exp(x)*sin(x)',

  'integral(exp(2*x)*sin(3*x),x)',
  '-3/13*exp(2*x)*cos(3*x)+2/13*exp(2*x)*sin(3*x)',

  'float(abs(eval(subst(3,b,subst(2,a,d(integral(exp(a*x)*cos(b*x),x),x)-exp(a*x)*cos(b*x))),x,7/10)))<10^(-9)',
  '1',

  // by parts, u = log / arctan / erf
  'integral(x*arctan(x),x)',
  '-1/2*x+1/2*arctan(x)+1/2*x^2*arctan(x)',

  'integral(x^2*log(x),x)',
  '-1/9*x^3+1/3*x^3*log(x)',

  'integral(sqrt(x)*log(x),x)',
  '-4/9*x^(3/2)+2/3*x^(3/2)*log(x)',

  'integral(log(x)^3,x)',
  '-6*x+6*x*log(x)-3*x*log(x)^2+x*log(x)^3',

  'chk(x*erf(x))',
  '1',

  // by parts, u = x^k
  'integral(x*sin(x)*cos(x),x)',
  '-1/4*x+1/8*sin(2*x)+1/2*x*sin(x)^2',

  'integral(x^2*exp(-x^2),x)',
  '-1/2*x*exp(-x^2)+1/4*pi^(1/2)*erf(x)',

  'chk(x*exp(x)*sin(x))',
  '1',

  'chk(x*sin(x)^2)',
  '1',

  'chk(x^2*cos(x))',
  '1',

  // tan^2 = 1/cos^2-1
  'integral(tan(x)^2,x)',
  '-x+tan(x)',

  'simplify(integral(tan(x)^2,x)+x)',
  'tan(x)',

  // abs of a linear argument
  'integral(abs(x),x)',
  '1/2*x*abs(x)',

  'chk(abs(2*x-1))',
  '1',

  'defint(abs(x),x,-1,1)',
  '1',

  'defint(abs(x-1),x,0,3)',
  '5/2',

  // 1/(x^2+b*x+c) with real roots
  'chk(1/(x^2-x-1))',
  '1',

  'chk(1/(2*x^2+3*x-2))',
  '1',

  // with other functions
  'd(integral(x*cos(x^2),x),x)',
  'x*cos(x^2)',

  'integral(d(exp(x)*sin(x),x),x)',
  'exp(x)*sin(x)',

  'defint(x*cos(x^2),x,0,sqrt(pi/2))',
  '1/2',

  'defint(exp(x)*sin(x),x,0,pi)',
  '1/2+1/2*exp(pi)',

  'defint(exp(x)*sin(x),x,0,1)',
  '1/2-1/2*e*cos(1)+1/2*e*sin(1)',

  // inside float() the integral is still found exactly, then converted:
  // (1+e*(sin(1)-cos(1)))/2 and -2*sin(1)+2*cos(1)+sin(1)
  'float(defint(exp(x)*sin(x),x,0,1))',
  '0.909331...',

  'float(defint(x^2*cos(x),x,0,1))',
  '0.239134...',

  'f(x)=x*exp(x^2)\nintegral(f(x)*x^2,x)',
  '-1/2*exp(x^2)+1/2*x^2*exp(x^2)',

  // still out of reach: not elementary, or a quartic that does not factor over Q
  'integral(sin(x)/x,x)',
  'Si(x)',

  'integral(sin(x)/x^2,x)',
  'Stop: integral: sorry, could not find a solution',

  'integral(x^x,x)',
  'Stop: integral: sorry, could not find a solution',

  'integral(exp(x^2)/x,x)',
  'Stop: integral: sorry, could not find a solution',

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
]);
