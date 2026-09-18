import { run_test } from '../test-harness';

run_test([
  'x=quote(x)',
  '',

  'f=quote(f)',
  '',

  'g=quote(g)',
  '',

  'd(a,x)',
  '0',

  'd(x,x)',
  '1',

  'd(x^2,x)',
  '2*x',

  'd(log(x),x)',
  '1/x',

  'd(exp(x),x)',
  'exp(x)',

  'd(a^x,x)',
  'a^x*log(a)',

  'd(x^x,x)-(x^x+x^x*log(x))',
  '0',

  'd(log(x^2+5),x)-(2*x/(5+x^2))',
  '0',

  'd(d(f(x),x),y)',
  '0',

  'd(d(f(x),y),x)',
  '0',

  'd(d(f(y),x),y)',
  '0',

  'd(d(f(y),y),x)',
  '0',

  'd([x*y*z,y,x+z],[x,y,z])',
  '[[y*z,x*z,x*y],[0,1,0],[1,0,1]]',

  'd(x+z,[x,y,z])',
  '[1,0,1]',

  'd(cos(theta)^2,cos(theta))',
  '2*cos(theta)',

  'd(f())',
  'd(f(),x)',

  'd(x^2)',
  '2*x',

  'd(t^2)',
  '2*t',

  'd(t^2 x^2)',
  '2*t^2*x',

  // trig functions

  'd(sin(x),x)-cos(x)',
  '0',

  'd(cos(x),x)+sin(x)',
  '0',

  'd(tan(x),x)-cos(x)^(-2)',
  '0',

  'd(arcsin(x),x)-1/sqrt(1-x^2)',
  '0',

  'd(arccos(x),x)+1/sqrt(1-x^2)',
  '0',

  'd(arctan(x),x)-1/(1+x^2)',
  '0',

  'd(arctan(y/x),x)',
  '-y/(x^2+y^2)',

  'd(arctan(y/x),y)',
  'x/(x^2+y^2)',

  // hyp functions

  'd(sinh(x),x)-cosh(x)',
  '0',

  'd(cosh(x),x)-sinh(x)',
  '0',

  'd(tanh(x),x)-cosh(x)^(-2)',
  '0',

  'd(arcsinh(x),x)-1/sqrt(x^2+1)',
  '0',

  'd(arccosh(x),x)-1/sqrt(x^2-1)',
  '0',

  'd(arctanh(x),x)-1/(1-x^2)',
  '0',

  'd(sin(cos(x)),x)+cos(cos(x))*sin(x)',
  '0',

  'd(sin(x)^2,x)-2*sin(x)*cos(x)',
  '0',

  'd(sin(cos(x)),cos(x))-cos(cos(x))',
  '0',

  'd(abs(x),x)',
  'sgn(x)',

  'd(sgn(x),x)',
  '2*dirac(x)',

  // generic functions

  'd(f(),x)',
  'd(f(),x)',

  'd(f(x),x)',
  'd(f(x),x)',

  'd(f(y),x)',
  '0',

  'd(g(f(x)),f(x))',
  'd(g(f(x)),f(x))',

  'd(g(f(x)),x)',
  'd(g(f(x)),x)',

  // other functions

  'd(erf(x))-2*exp(-x^2)/sqrt(pi)',
  '0',

  // arg lists

  'f=x^5*y^7',
  '',

  'd(f)',
  '5*x^4*y^7',

  'd(f,x)',
  '5*x^4*y^7',

  'd(f,x,0)',
  'x^5*y^7',

  'd(f,x,1)',
  '5*x^4*y^7',

  'd(f,x,2)',
  '20*x^3*y^7',

  'd(f,2)',
  '20*x^3*y^7',

  'd(f,2,y)',
  '140*x^3*y^6',

  'd(f,x,x,y,y)',
  '840*x^3*y^5',

  'f=quote(f)',
  '',

  // constants and other variables
  'd(5,x)',
  '0',

  'd(pi,x)',
  '0',

  'd(y,x)',
  '0',

  'd(x*y,y)',
  'x',

  'd(a*x^2+b*x+c,x)',
  '2*a*x+b',

  // power rule
  'd(x^n,x)',
  'n*x^(-1+n)',

  'd(sqrt(x),x)',
  '1/(2*x^(1/2))',

  'd(x^(1/3),x)',
  '1/(3*x^(2/3))',

  'd(1/x,x)',
  '-1/(x^2)',

  'd(2^x,x)',
  '2^x*log(2)',

  'd(1.5*x^2,x)',
  '3.0*x',

  // product and quotient rule
  'd(x*exp(x),x)',
  'exp(x)+x*exp(x)',

  'd(sin(x)*cos(x),x)',
  'cos(x)^2-sin(x)^2',

  // = 1/(x+1)^2
  'd(x/(1+x),x)',
  '1/(x+1)-x/((x+1)^2)',

  'd(f(x)*g(x),x)',
  'd(f(x),x)*g(x)+d(g(x),x)*f(x)',

  // chain rule
  'd(sin(3*x+1),x)',
  '3*cos(3*x+1)',

  'd(exp(-x^2),x)',
  '-2*x*exp(-x^2)',

  'd(sqrt(x^2+y^2),x)',
  'x/((x^2+y^2)^(1/2))',

  'd(log(x^2+y^2),y)',
  '2*y/(x^2+y^2)',

  'd(exp(x*y),y)',
  'x*exp(x*y)',

  'd(x^2*y+sin(x*y),x)',
  '2*x*y+y*cos(x*y)',

  'd(x^sin(x),x)',
  'x^(-1+sin(x))*sin(x)+x^(sin(x))*cos(x)*log(x)',

  // = 1/x
  'd(log(abs(x)),x)',
  'sgn(x)/abs(x)',

  // reciprocal trig functions
  'd(sec(x),x)',
  'sin(x)/(cos(x)^2)',

  'd(csc(x),x)',
  '-cos(x)/(sin(x)^2)',

  // = -1/sin(x)^2
  'd(cot(x),x)',
  '-1/(cos(x)^2*tan(x)^2)',

  // higher derivatives
  'd(x^3,x,3)',
  '6',

  'd(x^3,x,4)',
  '0',

  'd(x^2,x,0)',
  'x^2',

  'd(exp(2*x),x,5)',
  '32*exp(2*x)',

  'd(sin(x),x,4)',
  'sin(x)',

  'd(tan(x),x,2)',
  '2*sin(x)/(cos(x)^3)',

  'd(arctan(x),x,2)',
  '-2*x/((x^2+1)^2)',

  'd(1/(x^2+1),x,2)',
  '-2/((x^2+1)^2)+8*x^2/((x^2+1)^3)',

  'd(exp(x)*sin(x),x,2)',
  '2*exp(x)*cos(x)',

  'd(abs(x),x,2)',
  '2*dirac(x)',

  'd(f(x),x,2)',
  'd(d(f(x),x),x)',

  // a symbolic 3rd argument is another variable
  'd(x^3,x,x)',
  '6*x',

  'd(x^2,y,x)',
  '0',

  // mixed partials commute
  'd(x^2*y^3,x,y)',
  '6*x*y^2',

  'd(x^2*y^3,y,x)',
  '6*x*y^2',

  'd(x^2*y,x,2,y)',
  '2',

  // a negative order integrates
  'd(x,x,-1)',
  '1/2*x^2',

  'd(x,x,1/2)',
  'Stop: nth derivative: check n',

  // with respect to a subexpression
  'd(sin(x),sin(x))',
  '1',

  'd(x^2,x^2)',
  '1',

  // tensors: componentwise, and gradients
  'd([x^2,sin(x)],x)',
  '[2*x,cos(x)]',

  'd([[x,y],[x*y,1]],x)',
  '[[1,0],[y,0]]',

  'd(x^2+y^2,[x,y])',
  '[2*x,2*y]',

  // special functions
  'd(besselj(x,n),x)',
  'besselj(x,-1+n)-n*besselj(x,n)/x',

  'd(Gamma(x),x)',
  'd(Gamma(x),x)',

  // wrong number of arguments
  'd()',
  'Stop: d: expected at least 1 argument, got 0',
]);
