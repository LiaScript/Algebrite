import { run_test } from '../test-harness';

// Defects found by differential testing against mpmath. The numbers in the
// comments are mpmath values (quad, 20 digits).

// A. arctan(1/3*3^(1/2)*y) matched "sqrt(3)/3" by the first two factors of
// the product and gave pi/6 for every y.
run_test([
  'arctan(1/3*3^(1/2)*y)',
  'arctan(1/3*3^(1/2)*y)',

  'arctan(-1/3*3^(1/2)*y)',
  '-arctan(1/3*3^(1/2)*y)',

  'arctan(sqrt(15)*x/3)',
  'arctan(1/3*3^(1/2)*5^(1/2)*x)',

  // pi/sqrt(3) = 1.8138, arctan of it is 1.066933
  'float(arctan(1/3*3^(1/2)*pi))',
  '1.066933...',

  // sqrt(15)/3 / (1 + 15 x^2/9) = sqrt(15)/(3+5*x^2)
  'simplify(d(arctan(sqrt(15)*x/3),x)-sqrt(15)/(3+5*x^2))',
  '0',

  // the special values themselves stay
  'arctan(sqrt(3)/3)',
  '1/6*pi',

  'arctan(1/3*3^(1/2))',
  '1/6*pi',

  'arctan(1/sqrt(3))',
  '1/6*pi',

  'arctan(-sqrt(3)/3)',
  '-1/6*pi',

  'arctan(-1/sqrt(3))',
  '-1/6*pi',

  'arctan(sqrt(3))',
  '1/3*pi',

  'arctan(1)',
  '1/4*pi',

  'arctan(2-sqrt(3))',
  '1/12*pi',

  // longer products next to the other special values were right already
  'arctan(3^(1/2)*y)',
  'arctan(3^(1/2)*y)',

  'arctan(3^(-1/2)*y)',
  'arctan(y/(3^(1/2)))',

  'arctan((2-sqrt(3))*y)',
  'arctan((2-3^(1/2))*y)',
]);

// the same prefix match in arcsin and arccos: 1/2*2^(1/2)*y gave pi/4
run_test([
  'arcsin(1/2*2^(1/2)*y)',
  'arcsin(1/2*2^(1/2)*y)',

  'arcsin(-1/2*2^(1/2)*y)',
  'arcsin(-1/2*2^(1/2)*y)',

  'arccos(1/2*2^(1/2)*y)',
  'arccos(1/2*2^(1/2)*y)',

  'arccos(-1/2*2^(1/2)*y)',
  'arccos(-1/2*2^(1/2)*y)',

  // sqrt(2)/2*0.5 = 0.353553: arcsin 0.361367, arccos 1.209429
  'float(subst(1/2,y,arcsin(1/2*2^(1/2)*y)))',
  '0.361367...',

  'float(subst(1/2,y,arccos(1/2*2^(1/2)*y)))',
  '1.209429...',

  // arccos(-0.353553) = 1.932163
  'float(subst(1/2,y,arccos(-1/2*2^(1/2)*y)))',
  '1.932163...',

  // sqrt(6)/2 > 1 is outside the real domain, it is not pi/4
  'arcsin(1/2*2^(1/2)*3^(1/2))',
  'arcsin(1/2*2^(1/2)*3^(1/2))',

  'arccos(1/2*2^(1/2)*3^(1/2))',
  'arccos(1/2*2^(1/2)*3^(1/2))',

  // d/dy arcsin(y/sqrt(2)) = 1/sqrt(2-y^2), at y = 1: 1
  'subst(1,y,d(arcsin(1/2*2^(1/2)*y),y))',
  '1',

  // the special values stay
  'arcsin(sqrt(2)/2)',
  '1/4*pi',

  'arcsin(1/sqrt(2))',
  '1/4*pi',

  'arcsin(-sqrt(2)/2)',
  '-1/4*pi',

  'arccos(sqrt(2)/2)',
  '1/4*pi',

  'arccos(-sqrt(2)/2)',
  '3/4*pi',

  'arccos(-1/sqrt(2))',
  '3/4*pi',

  'arcsin(sqrt(3)/2)',
  '1/3*pi',

  'arccos(sqrt(3)/2)',
  '1/6*pi',

  // these were right already
  'arcsin(1/2*3^(1/2)*y)',
  'arcsin(1/2*3^(1/2)*y)',

  'arccos(1/2*3^(1/2)*y)',
  'arccos(1/2*3^(1/2)*y)',

  'arcsin(y/2)',
  'arcsin(1/2*y)',

  'cos(1/3*pi*y)',
  'cos(1/3*pi*y)',

  'sin(1/6*pi*y)',
  'sin(1/6*pi*y)',

  'tan(1/4*pi*y)',
  'tan(1/4*pi*y)',
]);

// the integrals that ran into arctan(1/3*3^(1/2)*...) and became constants
run_test([
  // d/dx arctan(sqrt(15)*x/3)/sqrt(15) = 1/(3+5*x^2)
  'simplify(d(integral(1/(3+5*x^2),x),x)-1/(3+5*x^2))',
  '0',

  'float(defint(1/(3+5*x^2),x,0,1))',
  '0.235410...',

  'float(defint(1/(3+5*t^2),t,-2,3))',
  '0.650507...',

  'float(defint(1/(3+7*x^2),x,0,1))',
  '0.216288...',

  'float(defint(1/(3+11*x^2),x,0,1))',
  '0.189661...',

  'float(defint(1/(6+10*x^2),x,0,1))',
  '0.117705...',

  // these reduce to arctan(x/sqrt(3)) and were right: pi/(12*sqrt(3)) etc.
  'float(defint(1/(6+2*x^2),x,0,1))',
  '0.151150...',

  'float(defint(1/(9+3*x^2),x,0,1))',
  '0.100767...',

  'float(defint(1/(12+4*x^2),x,0,2))',
  '0.123708...',

  'float(defint(1/(3+5*tan(x)^2),x,0,1))',
  '0.216025...',

  'float(defint(cos(3*x)^2/(3+4*sin(3*x)^2),x,0,1/2))',
  '0.069047...',

  'float(defint(x/(8+7*x^3),x,0,1))',
  '0.048036...',

  'float(defint(x^4/(8+7*x^3),x,0,1))',
  '0.016530...',

  // untouched neighbours
  'integral(1/(1+x^2),x)',
  'arctan(x)',

  'integral(1/(3+x^2),x)',
  'arctan(x/(3^(1/2)))/(3^(1/2))',

  'defint(1/(3+x^2),x,0,1)',
  'pi/(6*3^(1/2))',
]);

// the same kind of match in simplify: transpose(A)*transpose(B)*... was
// collected from the first two factors, the rest was dropped
run_test([
  'simplify(transpose(A)*transpose(B)*transpose(C))',
  'transpose(A)*transpose(B)*transpose(C)',

  'simplify(transpose(A)*transpose(B))',
  'transpose(A*B)',
]);

// B. integral(x^2/(a+b*x),x): the table entry had 1/b^2 for 1/b^3.
// x^2/(3*x+1) = x/3 - 1/9 + 1/(9*(3*x+1)), so x^2/6 - x/9 + log|3x+1|/27
run_test([
  'integral(x^2/(3*x+1),x)',
  '-1/9*x+1/27*log(abs(3*x+1))+1/6*x^2',

  'integral(t^2/(3*t+1),t)',
  '-1/9*t+1/27*log(abs(3*t+1))+1/6*t^2',

  // 1/6 - 1/9 + log(4)/27 = 0.106900
  'float(defint(x^2/(3*x+1),x,0,1))',
  '0.106900...',

  'float(defint(x^2/(3*x+1),x,-3,-1))',
  '-1.606900...',

  // x^2/(2-5*x) = -x/5 - 2/25 + 4/(25*(2-5*x))
  'integral(x^2/(2-5*x),x)',
  '-2/25*x-4/125*log(abs(-5*x+2))-1/10*x^2',

  'float(defint(x^2/(2-5*x),x,1,2))',
  '-0.411387...',

  'float(defint(x^2/(x/2+1/3),x,0,1))',
  '0.481147...',

  // symbolic: differentiating back gives the integrand
  'simplify(d(integral(x^2/(a*x+b),x),x)-x^2/(a*x+b))',
  '0',

  'simplify(d(integral(x^2/(a+b*x),x),x)-x^2/(a+b*x))',
  '0',

  // a = 1 was right
  'integral(x^2/(x+1),x)',
  '-x+log(abs(x+1))+1/2*x^2',

  'integral(x^2/(3*x),x)',
  '1/6*x^2',
]);

// consequences through substitution
run_test([
  // (1-u^2)/(1+3*u) = -u/3 + 1/9 + 8/(9*(1+3*u))
  'integral((1-u^2)/(1+3*u),u)',
  '1/9*u+8/27*log(abs(1+3*u))-1/6*u^2',

  'float(defint((1-u^2)/(1+3*u),u,0,1))',
  '0.355198...',

  'float(defint(cos(x)^3/(1+3*sin(x)),x,0,1))',
  '0.348733...',

  'float(defint(cos(x)^3/(3+4*sin(x)),x,0,1))',
  '0.151554...',

  'float(defint(sin(x)^3/(1+3*cos(x)),x,0,1))',
  '0.058332...',

  // these were right
  'integral(x^3/(2*x+1),x)',
  '1/8*x-1/16*log(abs(2*x+1))-1/8*x^2+1/6*x^3',

  'integral(x/(2*x+1),x)',
  '1/2*x-1/4*log(abs(2*x+1))',

  'integral(x^2/(3*x+1)^2,x)',
  '1/9*x-2/27*log(abs(3*x+1))-1/(27*(3*x+1))',

  'integral(x^2/(3*x+1)^3,x)',
  '1/27*log(abs(3*x+1))-1/(54*(3*x+1)^2)+2/(27*(3*x+1))',

  'float(defint(x^3/(2*x+1),x,0,1))',
  '0.098003...',

  'float(defint(x^2/(3*x+1)^2,x,0,1))',
  '0.036200...',
]);

// C. 1/(x*sqrt(x^2-c)): arcsec(x/sqrt(c))/sqrt(c) has the derivative
// 1/(abs(x)*sqrt(x^2-c)), wrong sign for x < 0. arctan(sqrt(x^2-c)/sqrt(c))
// has the derivative sqrt(c)/(x*sqrt(x^2-c)) on both branches.
run_test([
  'integral(1/(x*sqrt(x^2-1)),x)',
  'arctan((x^2-1)^(1/2))',

  'integral(1/(t*sqrt(t^2-1)),t)',
  'arctan((t^2-1)^(1/2))',

  'integral(1/(x*sqrt(x^2-4)),x)',
  '1/2*arctan(1/2*(x^2-4)^(1/2))',

  // mpmath: -0.18376186614 on (-3,-2), +0.18376186614 on (2,3)
  'float(defint(1/(x*sqrt(x^2-1)),x,-3,-2))',
  '-0.183762...',

  'float(defint(1/(x*sqrt(x^2-1)),x,2,3))',
  '0.183762...',

  'defint(1/(x*sqrt(x^2-1)),x,-inf,-1)',
  '-1/2*pi',

  'defint(1/(x*sqrt(x^2-1)),x,1,inf)',
  '1/2*pi',

  'float(defint(1/(x*sqrt(x^2-4)),x,-5,-3))',
  '-0.159105...',

  // the integrand at x = -2 is -0.288675
  'float(subst(-2,x,d(integral(1/(x*sqrt(x^2-1)),x),x)))',
  '-0.288675...',

  // sqrt(x^2-c)/x and 1/(x^3*sqrt(x^2-c)) used arcsec as well
  'float(defint(sqrt(x^2-4)/x,x,-5,-3))',
  '-1.710086...',

  'float(defint(sqrt(x^2-4)/x,x,3,5))',
  '1.710086...',

  'float(defint(1/(x^3*sqrt(x^2-4)),x,-5,-3))',
  '-0.011745...',

  'float(defint(1/(x^3*sqrt(x^2-4)),x,3,5))',
  '0.011745...',

  'simplify(d(integral(sqrt(x^2-4)/x,x),x)-sqrt(x^2-4)/x)',
  '0',

  // by substitution u = x-1
  'float(defint(1/((x-1)*sqrt(x^2-2*x)),x,-3,-2))',
  '-0.087157...',

  // the neighbours are right on negative x
  'float(defint(1/(x*sqrt(1-x^2)),x,-1/2,-1/4))',
  '-0.746479...',

  'float(defint(1/(x*sqrt(x^2+1)),x,-2,-1))',
  '-0.400162...',

  'float(defint(1/(x^2*sqrt(x^2-1)),x,-3,-2))',
  '0.076784...',

  'integral(1/(x^2*sqrt(x^2-1)),x)',
  '(x^2-1)^(1/2)/x',
]);

// D. Table entries that were right up to a constant but complex on half of
// the real line: log(.../x) for x < 0, log((s-sqrt(a))/(s+sqrt(a))) with
// s = sqrt(a+b*x) where s < sqrt(a). log(.../abs(x)) and
// log((s-sqrt(a))^2/abs(x)) have the same derivative and are real.
run_test([
  // -log((1+sqrt(3/4))/(1/2)) = -1.316958 (was -1.316958-3.141593*i)
  'float(subst(-1/2,x,integral(1/(x*sqrt(1-x^2)),x)))',
  '-1.316958...',

  // sqrt(6)-sqrt(7)*log(sqrt(7)+sqrt(6)) = -1.858606
  'float(subst(-1,x,integral(sqrt(7-x^2)/x,x)))',
  '-1.858606...',

  // -sqrt(6)/2+log(sqrt(7)+sqrt(6))/(2*sqrt(7)) = -0.917024
  'float(subst(-1,x,integral(sqrt(7-x^2)/x^3,x)))',
  '-0.917024...',

  // unchanged for x > 0: -log((1+sqrt(3/4))/(1/2))
  'float(subst(1/2,x,integral(1/(x*sqrt(1-x^2)),x)))',
  '-1.316958...',

  'float(defint(1/(x*sqrt(1-x^2)),x,-1/2,-1/4))',
  '-0.746479...',

  'float(defint(sqrt(7-x^2)/x,x,-2,-1))',
  '-1.517976...',

  'float(defint(sqrt(7-x^2)/x^3,x,-2,-1))',
  '-0.848566...',

  // the integrand at x = -1/2 is -2/sqrt(3/4) = -2.309401
  'float(subst(-1/2,x,d(integral(1/(x*sqrt(1-x^2)),x),x)))',
  '-2.309401...',
]);

run_test([
  // 1/(x*sqrt(3-2*x)): sqrt(3-2*x) < sqrt(3) for x > 0
  'imag(float(subst(1,x,integral(1/(x*sqrt(3-2*x)),x))))',
  '0.0',

  'imag(float(subst(-1,x,integral(1/(x*sqrt(3-2*x)),x))))',
  '0.0',

  'imag(float(subst(-1/4,x,integral(1/(x*sqrt(2+3*x)),x))))',
  '0.0',

  'imag(float(subst(1,x,integral(1/(x*sqrt(2+3*x)),x))))',
  '0.0',

  // entries 128, 129 and 137 are built on it
  'imag(float(subst(1,x,integral(sqrt(3-2*x)/x,x))))',
  '0.0',

  'imag(float(subst(1,x,integral(sqrt(3-2*x)/x^2,x))))',
  '0.0',

  'imag(float(subst(1,x,integral(1/(x^2*sqrt(3-2*x)),x))))',
  '0.0',

  // the integrand at x = -1 is -1/sqrt(5), at x = 1/2 it is sqrt(2)
  'float(subst(-1,x,d(integral(1/(x*sqrt(3-2*x)),x),x)))',
  '-0.447214...',

  'float(subst(1/2,x,d(integral(1/(x*sqrt(3-2*x)),x),x)))',
  '1.414214...',

  'float(defint(1/(x*sqrt(3-2*x)),x,-2,-1))',
  '-0.286734...',

  'float(defint(sqrt(3-2*x)/x,x,-2,-1))',
  '-1.679569...',

  'float(defint(sqrt(3-2*x)/x^2,x,-2,-1))',
  '1.199926...',

  'float(defint(1/(x^2*sqrt(3-2*x)),x,-2,-1))',
  '0.208819...',

  'float(defint(1/(x*sqrt(2+3*x)),x,-1/2,-1/4))',
  '-0.740542...',

  'float(defint(1/(x*sqrt(2+3*x)),x,1,2))',
  '0.277457...',

  // the arctan entry for a < 0 is untouched: 2/sqrt(3)*arctan(sqrt((2*x-3)/3))
  'integral(1/(x*sqrt(2*x-3)),x)',
  '2*arctan((2/3*x-1)^(1/2))/(3^(1/2))',
]);
