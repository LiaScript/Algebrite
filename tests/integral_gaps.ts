import { run_test } from '../test-harness';

// Integration gaps: completing the square under a radical, rational
// functions of sin/cos/tan (u = tan(x), then t = tan(x/2)), readable logs
// for 1/(a+b*x^3), sqrt(tan(x)) and the product rule read backwards.
//
// Every expected antiderivative was differentiated back and compared with
// the integrand numerically (python mpmath, 30 digits) at three points of
// its domain, one of them where a log argument is negative, so that a
// missing abs shows up as an imaginary part. The defint values come from
// mpmath.quad. Inside the tests, ok3(F,p,q,r) repeats that check: derivative
// equal to F at x = p, q, r and a real value of the antiderivative there. It is
// abs(float(...)), not float(abs(...)): the exact abs of a constant with
// nested radicals can take forever (numerator and rationalize of each part).
const helpers = [
  'chk(F,p)=abs(float(eval(d(integral(F,x),x)-F,x,p)))<10^(-9)',
  '',
  // the same for an antiderivative G found once, plus a real value at p
  'okat(G,F,p)=and(abs(float(eval(d(G,x)-F,x,p)))<10^(-9),abs(imag(float(eval(G,x,p))))<10^(-12))',
  '',
  'all3(G,F,p,q,r)=and(okat(G,F,p),okat(G,F,q),okat(G,F,r))',
  '',
  'ok3(F,p,q,r)=all3(integral(F,x),F,p,q,r)',
  '',
  'near(u,v)=abs(float(u)-v)<10^(-9)',
  '',
];

// 1. completing the square, numbers: u = x+1 gives u^2+4 or 4-u^2
run_test([
  ...helpers,

  'integral(1/sqrt(x^2+2*x+5),x)',
  'log(abs(1+x+(x^2+2*x+5)^(1/2)))',

  'integral(sqrt(x^2+2*x+5),x)',
  '2*log(abs(1+x+(x^2+2*x+5)^(1/2)))+1/2*(x^2+2*x+5)^(1/2)+1/2*x*(x^2+2*x+5)^(1/2)',

  'integral(x/sqrt(x^2+2*x+5),x)',
  '-log(abs(1+x+(x^2+2*x+5)^(1/2)))+(x^2+2*x+5)^(1/2)',

  'integral(x*sqrt(x^2+2*x+5),x)',
  '-2*log(abs(1+x+(x^2+2*x+5)^(1/2)))-1/2*(x^2+2*x+5)^(1/2)+1/3*(x^2+2*x+5)^(3/2)-1/2*x*(x^2+2*x+5)^(1/2)',

  'integral(1/(x^2+2*x+5)^(3/2),x)',
  '1/(4*(x^2+2*x+5)^(1/2))+x/(4*(x^2+2*x+5)^(1/2))',

  'integral(1/sqrt(3-2*x-x^2),x)',
  'arcsin(1/2*x+1/2)',

  'integral(sqrt(3-2*x-x^2),x)',
  '2*arcsin(1/2*x+1/2)+1/2*(-x^2-2*x+3)^(1/2)+1/2*x*(-x^2-2*x+3)^(1/2)',

  'integral(x/sqrt(3-2*x-x^2),x)',
  '-arcsin(1/2*x+1/2)-(-x^2-2*x+3)^(1/2)',

  // a constant factor and another variable name
  'integral(3/sqrt(t^2+2*t+5),t)',
  '3*log(abs(1+t+(t^2+2*t+5)^(1/2)))',

  // odd linear coefficient: u = x-3/2, u^2-5/4 (real for x > (3+sqrt(5))/2)
  'ok3(1/sqrt(x^2-3*x+1),3,4,10)',
  '1',

  'ok3(x^2/sqrt(x^2+2*x+5),-3,0,2)',
  '1',

  'ok3((2*x+3)/sqrt(x^2+2*x+5),-3,0,2)',
  '1',

  'ok3(sqrt(x^2+2*x+5),-3,0,2)',
  '1',

  'ok3(x*sqrt(3-2*x-x^2),-2,0,1/2)',
  '1',

  // inside float() the integral is found exactly and converted afterwards
  'float(defint(1/sqrt(x^2+2*x+5),x,0,2))',
  '0.713551...',

  'near(defint(1/sqrt(x^2+2*x+5),x,0,2),0.713551392227506)',
  '1',

  'near(defint(sqrt(x^2+2*x+5),x,-1,1),4.59117429878528)',
  '1',

  // exact: arcsin(1)-arcsin(-1)
  'defint(1/sqrt(3-2*x-x^2),x,-3,1)',
  'pi',
]);

// 1b. leading coefficient other than 1, and integer powers of a quadratic
run_test([
  ...helpers,

  'integral(1/sqrt(2*x^2+1),x)',
  'log(abs((2*x^2+1)^(1/2)+2^(1/2)*x))/(2^(1/2))',

  'integral(1/sqrt(1-2*x^2),x)',
  'arcsin(2^(1/2)*x)/(2^(1/2))',

  'integral(x/sqrt(2*x^2+1),x)',
  '1/2*(2*x^2+1)^(1/2)',

  'integral(x*sqrt(2*x^2+1),x)',
  '1/6*(2*x^2+1)^(3/2)',

  'integral(1/(2*x^2+1)^(3/2),x)',
  'x/((2*x^2+1)^(1/2))',

  'integral(x/(2*x^2+1)^(3/2),x)',
  '-1/(2*(2*x^2+1)^(1/2))',

  'ok3(1/sqrt(2*x^2+4*x+5),-2,0,3)',
  '1',

  'ok3(1/sqrt(5-4*x-2*x^2),-2,0,1/2)',
  '1',

  'ok3(x/sqrt(2*x^2+4*x+5),-2,0,3)',
  '1',

  'ok3(sqrt(2*x^2+4*x+5),-2,0,3)',
  '1',

  'ok3(1/(3-x^2)^(3/2),-1,0,3/2)',
  '1',

  'integral(1/(2*x^2+2*x+5),x)',
  '1/3*arctan(2/3*x+1/3)',

  'integral(1/(x^2+2*x+5)^2,x)',
  '1/16*arctan(1/2*x+1/2)+1/(8*(x^2+2*x+5))+x/(8*(x^2+2*x+5))',

  'integral(x/(x^2+2*x+5)^2,x)',
  '-1/16*arctan(1/2*x+1/2)-5/(8*(x^2+2*x+5))-x/(8*(x^2+2*x+5))',

  'ok3(1/(3*x^2-2*x+1)^2,-2,0,3)',
  '1',

  'ok3((x+2)/(2*x^2+2*x+5),-2,0,3)',
  '1',

  'simplify(d(integral(1/(2*x^2+2*x+5),x),x)-1/(2*x^2+2*x+5))',
  '0',
]);

// 1c. symbols: the sign of the leading coefficient picks log or arcsin,
// so it has to be known
run_test([
  'integral(1/sqrt(a*x^2+b*x+c),x)',
  'Stop: integral: sorry, could not find a solution',

  'integral(1/sqrt(a*x^2+1),x)',
  'Stop: integral: sorry, could not find a solution',

  // leading coefficient 1: log(u+sqrt(u^2+m)) whatever the sign of m
  'G=integral(1/sqrt(x^2+b*x+c),x)',
  '',

  'abs(float(eval(subst(3,b,subst(7,c,d(G,x)-1/sqrt(x^2+b*x+c))),x,1/2)))<10^(-9)',
  '1',

  'abs(float(eval(subst(3,b,subst(-7,c,d(G,x)-1/sqrt(x^2+b*x+c))),x,4)))<10^(-9)',
  '1',

  'assume(a>0)',
  '',

  'integral(1/sqrt(a*x^2+1),x)',
  'log(abs((a*x^2+1)^(1/2)+a^(1/2)*x))/(a^(1/2))',

  'G=integral(1/sqrt(a*x^2+b*x+c),x)',
  '',

  'abs(float(eval(subst(2,a,subst(3,b,subst(7,c,d(G,x)-1/sqrt(a*x^2+b*x+c)))),x,1/2)))<10^(-9)',
  '1',

  'abs(float(eval(subst(2,a,subst(3,b,subst(7,c,d(G,x)-1/sqrt(a*x^2+b*x+c)))),x,-3)))<10^(-9)',
  '1',

  'G=integral(x/sqrt(a*x^2+b*x+c),x)',
  '',

  'abs(float(eval(subst(2,a,subst(3,b,subst(7,c,d(G,x)-x/sqrt(a*x^2+b*x+c)))),x,1/2)))<10^(-9)',
  '1',

  'forget()',
  '',

  'assume(a<0)',
  '',

  'integral(1/sqrt(a*x^2+1),x)',
  'arcsin((-a)^(1/2)*x)/((-a)^(1/2))',

  'G=integral(1/sqrt(a*x^2+b*x+c),x)',
  '',

  'abs(float(eval(subst(-2,a,subst(3,b,subst(7,c,d(G,x)-1/sqrt(a*x^2+b*x+c)))),x,1/2)))<10^(-9)',
  '1',

  'abs(imag(float(eval(subst(-2,a,subst(3,b,subst(7,c,G))),x,1/2))))<10^(-12)',
  '1',

  'forget()',
  '',

  'integral(1/sqrt(a*x^2+b*x+c),x)',
  'Stop: integral: sorry, could not find a solution',

  // arctan or log by the sign of 4*a*c-b^2, which is not known
  'integral(1/(a*x^2+b*x+c),x)',
  'Stop: integral: sorry, could not find a solution',

  'integral(1/(a*x^2+b*x+c)^2,x)',
  'Stop: integral: sorry, could not find a solution',

  // 4*2*(a^2/2+1)-(2*a)^2 = 8 whatever a is: arctan
  'G=integral(1/(2*x^2+2*a*x+a^2/2+1),x)',
  '',

  'abs(float(eval(subst(3,a,d(G,x)-1/(2*x^2+2*a*x+a^2/2+1)),x,1/2)))<10^(-9)',
  '1',

  'abs(float(eval(subst(-3,a,d(G,x)-1/(2*x^2+2*a*x+a^2/2+1)),x,1/2)))<10^(-9)',
  '1',

  // a, c positive: the sign of 4*a*c-b^2 is still open
  'assume(a>0)',
  '',

  'assume(c>0)',
  '',

  'integral(1/(a*x^2+b*x+c),x)',
  'Stop: integral: sorry, could not find a solution',

  'forget()',
  '',
]);

// 2. rational functions of sin, cos, tan
run_test([
  ...helpers,

  // t = tan(x/2): 2/(1+2*t-t^2), roots 1+sqrt(2) and 1-sqrt(2)
  'integral(1/(sin(x)+cos(x)),x)',
  'log(abs(1-2^(1/2)-tan(1/2*x)))/(2^(1/2))-log(abs(1+2^(1/2)-tan(1/2*x)))/(2^(1/2))',

  'ok3(1/(sin(x)+cos(x)),-1,0,14/5)',
  '1',

  // 1/(a+b*cos(x)) with |a| < |b|: 1/(4-t^2)
  'integral(1/(3+5*cos(x)),x)',
  '-1/4*log(abs(2-tan(1/2*x)))+1/4*log(abs(2+tan(1/2*x)))',

  'ok3(1/(3+5*cos(x)),0,5/2,-5/2)',
  '1',

  'ok3(1/(3-5*cos(x)),1/2,2,-2)',
  '1',

  'ok3(1/(-3+5*cos(x)),1/2,2,-2)',
  '1',

  'integral(1/(1+2*cos(x)),x)',
  '-log(abs(3^(1/2)-tan(1/2*x)))/(3^(1/2))+log(abs(3^(1/2)+tan(1/2*x)))/(3^(1/2))',

  'ok3(1/(1+2*cos(x)),0,5/2,-5/2)',
  '1',

  // 1/(a+b*sin(x)) with |a| < |b|: 2/(3*t^2+10*t+3)
  'integral(1/(3+5*sin(x)),x)',
  '1/4*log(abs(1+3*tan(1/2*x)))-1/4*log(abs(3+tan(1/2*x)))',

  'ok3(1/(3+5*sin(x)),0,-1,-14/5)',
  '1',

  'ok3(1/(1-2*sin(x)),0,1,3)',
  '1',

  // a*x+b as the argument
  'ok3(1/(3+5*cos(2*x+1)),0,1,-1)',
  '1',

  'ok3(1/(sin(2*x+1)+cos(2*x+1)),-1,0,1)',
  '1',

  // 1/(1+t)
  'integral(1/(1+sin(x)+cos(x)),x)',
  'log(abs(1+tan(1/2*x)))',

  'ok3(1/(1+sin(x)+cos(x)),0,-2,1)',
  '1',

  // -1/((2*t+1)*(t-2))
  'integral(1/(3*sin(x)+4*cos(x)),x)',
  '1/5*log(abs(1+2*tan(1/2*x)))-1/5*log(abs(2-tan(1/2*x)))',

  'ok3(1/(3*sin(x)+4*cos(x)),0,-2,3)',
  '1',

  // (1+t^2)/2
  'integral(1/(1+cos(x))^2,x)',
  '1/6*tan(1/2*x)^3+1/2*tan(1/2*x)',

  // 1-cos(x) in disguise
  'ok3(sin(x)^2/(1+cos(x)),0,1,2)',
  '1',

  'ok3(1/(2+sin(x)+cos(x)),0,1,-2)',
  '1',

  'ok3((1+sin(x))/(1+cos(x)),0,1,-2)',
  '1',

  'ok3(cos(x)/(2-cos(x)),0,1,-2)',
  '1',

  'ok3(1/(2+cos(x))^2,0,1,-2)',
  '1',

  'ok3((sin(x)+2*cos(x))/(3*sin(x)+cos(x)),0,1,2)',
  '1',

  // a symbol as coefficient: the discriminant 4+4*a^2 is positive anyway
  'G=integral(1/(sin(x)+a*cos(x)),x)',
  '',

  'abs(float(eval(subst(2,a,d(G,x)-1/(sin(x)+a*cos(x))),x,1/2)))<10^(-9)',
  '1',

  'abs(float(eval(subst(-2,a,d(G,x)-1/(sin(x)+a*cos(x))),x,2)))<10^(-9)',
  '1',

  'abs(imag(float(eval(subst(2,a,G),x,3))))<10^(-12)',
  '1',

  'near(defint(1/(sin(x)+cos(x)),x,0,1),0.776150000059282)',
  '1',

  'near(defint(1/(3+5*cos(x)),x,0,1),0.140132996307221)',
  '1',

  'near(defint(1/(1+sin(x)+cos(x)),x,0,1),0.435866590692474)',
  '1',
]);

// 2b. u = tan(x) where sin and cos only come in even combinations
run_test([
  ...helpers,

  'integral(1/cos(x)^4,x)',
  '1/3*tan(x)^3+tan(x)',

  'integral(1/sin(x)^4,x)',
  '-1/(3*tan(x)^3)-1/tan(x)',

  // u^3/(1+u^2): tan(x)^2/2-log(1+tan(x)^2)/2, which simplify writes with
  // cos; the number -1/2 it leaves behind is a constant of integration
  'integral(tan(x)^3,x)',
  'log(abs(cos(x)))+1/(2*cos(x)^2)',

  'integral(tan(x)^4,x)',
  'x+1/3*tan(x)^3-tan(x)',

  'integral(1/(1+sin(x)^2),x)',
  'arctan(2^(1/2)*tan(x))/(2^(1/2))',

  'integral(1/(1+tan(x)),x)',
  '1/2*x+1/2*log(abs(1+tan(x)))+1/2*log(abs(cos(x)))',

  'ok3(1/(1+tan(x)),0,1,2)',
  '1',

  'ok3(cos(x)/(sin(x)+cos(x)),0,1,2)',
  '1',

  'ok3(tan(x)/(1+tan(x)),0,1,2)',
  '1',

  'ok3(1/(1+3*cos(x)^2),0,1,2)',
  '1',

  'ok3(1/(4*sin(x)^2+9*cos(x)^2),0,1,2)',
  '1',

  'ok3(1/cos(x)^6,0,1,2)',
  '1',

  'ok3(tan(x)^5,0,1,2)',
  '1',

  'integral(tan(x)^6,x)',
  '-x-1/3*tan(x)^3+1/5*tan(x)^5+tan(x)',

  'integral(1/(sin(x)^2*cos(x)^4),x)',
  '-1/tan(x)+1/3*tan(x)^3+2*tan(x)',

  'ok3(sin(x)/(sin(x)+cos(x)),0,1,2)',
  '1',

  'ok3(sin(x)^4/(1+cos(x)^2),0,1,2)',
  '1',

  'ok3(tan(2*x)^3,0,1/4,1)',
  '1',

  'ok3(1/cos(3*x)^4,0,1/4,1)',
  '1',

  'near(defint(1/cos(x)^4,x,0,1),2.81658164059915)',
  '1',

  'near(defint(1/(1+sin(x)^2),x,0,1),0.809352817335295)',
  '1',
]);

// 2c. tan(x) is real for real x, so the logs of the table get their abs:
// log(tan(x/2)) is complex where tan(x/2) < 0 (x = 4)
run_test([
  ...helpers,

  'isreal(tan(x))',
  '1',

  'integral(1/(sin(x)*cos(x)),x)',
  'log(abs(tan(x)))',

  'integral(1/sin(x),x)',
  'log(abs(tan(1/2*x)))',

  'integral(1/cos(x),x)',
  'log(abs(tan(1/2*x+1/4*pi)))',

  'ok3(1/(sin(x)*cos(x)),1,2,-1)',
  '1',

  'ok3(1/sin(x),1,-1,4)',
  '1',

  'ok3(1/cos(x),1,2,4)',
  '1',
]);

// 3. 1/(a+b*x^3) with numbers: one log per factor, abs on the linear one
// only, and the arctan argument the way it is written
run_test([
  ...helpers,

  'integral(1/(x^3+1),x)',
  '1/3*log(abs(x+1))-1/6*log(x^2-x+1)+arctan(2*x/(3^(1/2))-1/(3^(1/2)))/(3^(1/2))',

  'integral(1/(x^3-1),x)',
  '1/3*log(abs(-x+1))-1/6*log(x^2+x+1)-1/3*3^(1/2)*arctan(2*x/(3^(1/2))+1/3^(1/2))',

  'integral(1/(x^3+8),x)',
  '1/12*log(abs(x+2))-1/24*log(x^2-2*x+4)+1/12*3^(1/2)*arctan(x/(3^(1/2))-1/(3^(1/2)))',

  'ok3(1/(x^3+1),-3,0,2)',
  '1',

  'ok3(1/(x^3-1),-3,0,2)',
  '1',

  'ok3(1/(1-x^3),-3,0,2)',
  '1',

  'ok3(1/(x^3+2),-3,0,2)',
  '1',

  'ok3(1/(2*x^3+1),-3,0,2)',
  '1',

  'ok3(1/(2*x^3-5),-3,0,2)',
  '1',

  'ok3(5/(x^3+27),-4,0,2)',
  '1',

  'near(defint(1/(x^3+1),x,0,2),1.09000173022846)',
  '1',

  'near(defint(1/(x^3-1),x,2,3),0.0753893510232044)',
  '1',

  // symbols: the real cube root needs the sign of a*b
  'assume(a>0)',
  '',

  'assume(b>0)',
  '',

  'G=integral(1/(a+b*x^3),x)',
  '',

  'abs(float(eval(subst(2,a,subst(3,b,d(G,x)-1/(a+b*x^3))),x,-2)))<10^(-9)',
  '1',

  'abs(imag(float(eval(subst(2,a,subst(3,b,G)),x,-2))))<10^(-12)',
  '1',

  'forget(a)',
  '',

  'assume(a<0)',
  '',

  'G=integral(1/(a+b*x^3),x)',
  '',

  'abs(float(eval(subst(-2,a,subst(3,b,d(G,x)-1/(a+b*x^3))),x,-2)))<10^(-9)',
  '1',

  'abs(imag(float(eval(subst(-2,a,subst(3,b,G)),x,-2))))<10^(-12)',
  '1',

  'forget()',
  '',

  // arctan is odd: the minus sign comes out when every leading sign is one
  'arctan(-x)',
  '-arctan(x)',

  'arctan(-x-1)',
  '-arctan(x+1)',

  'arctan(b-a)',
  '-arctan(a-b)',

  'arctan(x-1)',
  'arctan(x-1)',

  'arctan(1-x)',
  'arctan(-x+1)',

  'arctan((2*x-1)/sqrt(3))',
  'arctan(2*x/(3^(1/2))-1/(3^(1/2)))',

  'arctan(-2-sqrt(3))',
  '-5/12*pi',
]);

// 4. sqrt(tan(x)) with u = sqrt(tan(x)): 2*u^2/(1+u^4); the product rule
run_test([
  ...helpers,

  'integral(sqrt(tan(x)),x)',
  'arctan(-1+2^(1/2)*tan(x)^(1/2))/(2^(1/2))+arctan(1+2^(1/2)*tan(x)^(1/2))/(2^(1/2))+log(1+tan(x)-2^(1/2)*tan(x)^(1/2))/(2*2^(1/2))-log(1+tan(x)+2^(1/2)*tan(x)^(1/2))/(2*2^(1/2))',

  'chk(sqrt(tan(x)),1/2)',
  '1',

  'chk(sqrt(tan(x)),1)',
  '1',

  'chk(sqrt(tan(x)),4)',
  '1',

  'chk(sqrt(tan(2*x)),1/3)',
  '1',

  'near(defint(sqrt(tan(x)),x,0,1),0.727298249343511)',
  '1',

  'integral(d(f(x),x)*g(x)+f(x)*d(g(x),x),x)',
  'f(x)*g(x)',

  'integral(d(f(x),x)*g(x)+f(x)*d(g(x),x)+2*x,x)',
  'x^2+f(x)*g(x)',

  'integral(d(f(x),x)*g(x)*h(x)+f(x)*d(g(x),x)*h(x)+f(x)*g(x)*d(h(x),x),x)',
  'f(x)*g(x)*h(x)',

  'integral(d(f(x),x)*sin(x)+f(x)*cos(x),x)',
  'f(x)*sin(x)',

  // half of the pattern is not enough
  'integral(d(f(x),x)*g(x),x)',
  'Stop: integral: sorry, could not find a solution',
]);

// what must stay as it is
run_test([
  'integral(1/sqrt(x^2+1),x)',
  'log(abs(x+(x^2+1)^(1/2)))',

  'integral(1/sqrt(4-x^2),x)',
  'arcsin(1/2*x)',

  'integral(sqrt(x^2+4),x)',
  '2*log(abs(x+(x^2+4)^(1/2)))+1/2*x*(x^2+4)^(1/2)',

  'integral(sqrt(2*x^2+3),x)',
  '1/2*x*(2*x^2+3)^(1/2)+3*log(abs((2*x^2+3)^(1/2)+2^(1/2)*x))/(2*2^(1/2))',

  'integral(x/sqrt(x^2+4),x)',
  '(x^2+4)^(1/2)',

  'integral(1/(x^2+2*x+5),x)',
  '1/2*arctan(1/2*x+1/2)',

  'integral(1/(x^2+x+1),x)',
  '2*arctan(2*x/(3^(1/2))+1/3^(1/2))/(3^(1/2))',

  'integral(1/(x^2+2*x-3),x)',
  '1/4*log(abs(-x+1))-1/4*log(abs(x+3))',

  'integral(1/(x^2+2*x+1),x)',
  '-1/(x+1)',

  'integral(1/(5+3*cos(x)),x)',
  '1/2*arctan(1/2*tan(1/2*x))',

  'integral(1/(2+sin(x)),x)',
  '2*arctan(1/3^(1/2)+2*tan(1/2*x)/(3^(1/2)))/(3^(1/2))',

  'integral(1/(1+cos(x)),x)',
  'tan(1/2*x)',

  'integral(1/(1-cos(x)),x)',
  '-1/tan(1/2*x)',

  'integral(1/(1+sin(x)),x)',
  '-tan(-1/2*x+1/4*pi)',

  'integral(sin(x)/(1+cos(x)),x)',
  '-log(abs(1+cos(x)))',

  'integral(cos(x)/(1+sin(x)),x)',
  'log(abs(1+sin(x)))',

  'integral(tan(x)^2,x)',
  '-x+tan(x)',

  'integral(1/cos(x)^3,x)',
  '1/2*arctanh(sin(x))+sin(x)/(2*cos(x)^2)',

  'integral(sin(x)^2*cos(x)^3,x)',
  '1/3*sin(x)^3-1/5*sin(x)^5',

  'integral(1/(x^4-1),x)',
  '-1/2*arctan(x)-1/4*log(abs(x+1))+1/4*log(abs(-x+1))',

  'integral((x+1)/(x^2+x+1),x)',
  '1/2*log(x^2+x+1)+arctan(2*x/(3^(1/2))+1/3^(1/2))/(3^(1/2))',

  // symbols A, B of unknown sign keep the one formula that holds for both
  'integral(1/(A+B*X^3),X)-1/3*1/A*(A/B)^(1/3)*(1/2*log(((A/B)^(1/3)+X)^3/(A+B*X^3))+sqrt(3)*arctan((2*X-(A/B)^(1/3))*(A/B)^(-1/3)/sqrt(3)))',
  '0',

  // x outside the trig functions: not a rational function of sin and cos
  'integral(x/(sin(x)+cos(x)),x)',
  'Stop: integral: sorry, could not find a solution',

  'integral(1/(x+sin(x)),x)',
  'Stop: integral: sorry, could not find a solution',

  'integral(sin(x)/x^2,x)',
  'Stop: integral: sorry, could not find a solution',

  // two different arguments
  'integral(1/(sin(x)+cos(2*x)+3),x)',
  'Stop: integral: sorry, could not find a solution',

  // a perfect square under the root is 1/abs(x+1)
  'integral(1/sqrt(x^2+2*x+1),x)',
  'Stop: integral: sorry, could not find a solution',

  // no table form after the shift
  'integral(1/(x*sqrt(x^2+2*x+5)),x)',
  'Stop: integral: sorry, could not find a solution',

  'integral(exp(x)/sqrt(x^2+2*x+5),x)',
  'Stop: integral: sorry, could not find a solution',

  'integral(exp(x)/(1+sin(x)),x)',
  'Stop: integral: sorry, could not find a solution',

  'integral(sqrt(sin(x)),x)',
  'Stop: integral: sorry, could not find a solution',

  // a cubic under the root is elliptic
  'integral(1/sqrt(x^3+2*x+5),x)',
  'Stop: integral: sorry, could not find a solution',
]);
