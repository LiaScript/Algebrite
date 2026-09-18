import { run_test } from '../test-harness';

// Symbols without assumptions are real with an unknown sign. Rules that
// hold only for positive values need the assumption. log(u) is the
// principal logarithm; log(a^b) = b log(a) holds for a > 0, for b in
// (-1,1], and with abs() for even b and real a.
run_test([
  'log(x^2)',
  '2*log(abs(x))',

  'log(x^4)',
  '4*log(abs(x))',

  // log(x^3) = 3 log(x) fails for x < 0 (3 i pi vs i pi)
  'log(x^3)',
  'log(x^3)',

  'log(x^(1/2))',
  '1/2*log(x)',

  'log(1/x)',
  'log(1/x)',

  'log(exp(x))',
  'x',

  'log(2^x)',
  'log(2)*x',

  // log(a b) = log(a) + log(b) when at most one factor is not positive
  'log(2*x)',
  'log(2)+log(x)',

  'log(x/3)',
  '-log(3)+log(x)',

  'log(x*y)',
  'log(x*y)',

  'log(-x)',
  'log(-x)',

  'log(pi*x^2)',
  'log(pi)+2*log(abs(x))',

  // numbers are unchanged
  'log(-2)',
  'log(2)+i*pi',

  'log(8)',
  'log(8)',

  // with assumptions the short forms come back
  'assume(x>0)',
  '',

  'log(x^3)',
  '3*log(x)',

  'log(1/x)',
  '-log(x)',

  // one factor positive is enough
  'log(x*y)',
  'log(x)+log(y)',

  'log(-x)',
  'log(x)+i*pi',

  'assume(w<0)',
  '',

  'log(w^2)',
  '2*log(-w)',

  'log(w^3)',
  'log(w^3)',
]);

// integral: a term c*log(u) with c constant and u real gets abs(u), since
// d/dx log|u| = u'/u as well; log(u) only where u is known positive
run_test([
  'integral(1/x,x)',
  'log(abs(x))',

  'integral(3/x,x)',
  '3*log(abs(x))',

  'integral(1/(x+1),x)',
  'log(abs(x+1))',

  'integral(1/(2*x-3),x)',
  '1/2*log(abs(-2*x+3))',

  'integral(x/(x^2+1),x)',
  '1/2*log(x^2+1)',

  'integral(1/x+x,x)',
  'log(abs(x))+1/2*x^2',

  // not a constant times log: log(x) must stay
  'integral(log(x),x)',
  '-x+x*log(x)',

  'assume(t>0)',
  '',

  'integral(1/t,t)',
  'log(t)',

  'assume(s<0)',
  '',

  'integral(1/s,s)',
  'log(-s)',

  // the definite integral is unchanged
  'defint(1/x,x,1,2)',
  'log(2)',

  'defint(1/x,x,-2,-1)',
  '-log(2)',
]);

// x^n = a: roots a^(1/n) times the n-th roots of unity, not i*(-a)^(1/2)
run_test([
  'solve(x^2=a,x)',
  '[-a^(1/2),a^(1/2)]',

  'roots(x^2-a,x)',
  '[-a^(1/2),a^(1/2)]',

  'solve(x^2=4*a,x)',
  '[-(4*a)^(1/2),(4*a)^(1/2)]',

  'solve(x^2+a,x)',
  '[-i*a^(1/2),i*a^(1/2)]',

  'solve(x^2-4,x)',
  '[-2,2]',
]);

// arg of a real value of unknown sign is 0 or pi: unevaluated (it was 0)
run_test([
  'arg(a-b)',
  'arg(a-b)',

  'arg(x+y)',
  'arg(x+y)',

  'arg(x^2+1)',
  '0',

  'arg(-x^2-1)',
  'pi',

  'arg(abs(a))',
  '0',

  'arg(0)',
  '0',

  // on the imaginary axis: pi/2, not pi as before
  'arg(i*x^2+i)',
  '1/2*pi',

  'arg(-i*x^2-i)',
  '-1/2*pi',

  // x^i = exp(i log(x)): its arg is log(x) reduced to (-pi,pi], not 0
  'arg(x^i)',
  'arg(x^i)',

  'arg(3+4*i)',
  'arctan(4/3)',

  'assume(a>0)',
  '',

  'arg(a+i)',
  'arctan(1/a)',
]);
