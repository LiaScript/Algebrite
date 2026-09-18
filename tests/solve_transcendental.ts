import { run_test } from '../test-harness';

// solve() beyond polynomials: the equation is rewritten in one "kernel"
// (exp, log, sin, cos, tan, a radical, abs, an inverse trig function) that
// is solved for and inverted; every candidate is checked in the original
// equation, which drops extraneous roots from squaring and log domains.
// Trig equations give the principal solutions; solve(eq, x, n) gives the
// periodic families, see solve_general.ts.
run_test([
  // exponentials: b^g(x) = c  <=>  g(x) = log(c)/log(b)
  'solve(exp(x)=2,x)',
  'log(2)',

  'solve(exp(x)==2,x)',
  'log(2)',

  'solve(exp(x)-1,x)',
  '0',

  'solve(exp(x)=a,x)',
  'log(a)',

  'solve(a*exp(x)=b,x)',
  'log(b/a)',

  'solve(exp(2*x)=exp(6),x)',
  '3',

  'solve(exp(x^2)=1,x)',
  '0',

  'solve(exp(x)=0,x)',
  'Stop: solve: no solution',

  // log(-1) = i*pi
  'solve(exp(x)=-1,x)',
  'i*pi',

  'solve(2^x=8,x)',
  '3',

  'solve(2^x=1/4,x)',
  '-2',

  'solve(2^x=3,x)',
  'log(3)/log(2)',

  'solve(3^(x+1)=9,x)',
  '1',

  // u = exp(x): u^2-3*u+2 = (u-1)*(u-2)
  'solve(exp(2*x)-3*exp(x)+2,x)',
  '[0,log(2)]',

  // u = 2^x, 4^x = u^2
  'solve(4^x-3*2^x+2,x)',
  '[0,1]',

  // u + 1/u = 2  <=>  (u-1)^2 = 0
  'solve(exp(x)+exp(-x)=2,x)',
  '0',

  // Lambert W, see special.ts
  'solve(x*exp(x)=1,x)',
  'lambertw(1)',

  'solve(exp(x)=x,x)',
  'Stop: solve: cannot solve the equation for x',

  // logarithms
  // exp(1) prints as e
  'solve(log(x)=1,x)',
  'e',

  'solve(log(x)=0,x)',
  '1',

  'solve(log(x)=a,x)',
  'exp(a)',

  'solve(log(x)=-1,x)',
  'exp(-1)',

  'solve(log(2*x+1)=0,x)',
  '0',

  'solve(log(x-1)=2,x)',
  '1+exp(2)',

  'solve(log(x)^2-3*log(x)+2,x)',
  '[e,exp(2)]',

  // x*(x-3) = 10 has the roots 5 and -2; -2 is rejected because
  // log(-2)+log(-5) = log(10)+2*i*pi
  'solve(log(x)+log(x-3)=log(10),x)',
  '5',

  // x^2 = 4, but 2*log(-2) = log(4)+2*i*pi
  'solve(2*log(x)=log(4),x)',
  '2',

  'solve(log(x)=log(3)+log(4),x)',
  '12',

  // trig: principal solutions; sin gives arcsin(c) and pi-arcsin(c),
  // cos gives -arccos(c) and arccos(c), tan gives arctan(c)
  'solve(sin(x)=1/2,x)',
  '[1/6*pi,5/6*pi]',

  'solve(sin(x)=0,x)',
  '[0,pi]',

  'solve(sin(x),x)',
  '[0,pi]',

  'solve(sin(x)=1,x)',
  '1/2*pi',

  'solve(sin(x)=-1,x)',
  '-1/2*pi',

  'solve(sin(x)=2,x)',
  'Stop: solve: no solution',

  'solve(sin(x)=a,x)',
  '[arcsin(a),pi-arcsin(a)]',

  'solve(cos(x)=1/2,x)',
  '[-1/3*pi,1/3*pi]',

  'solve(cos(x)=-1,x)',
  'pi',

  'solve(cos(x)=1,x)',
  '0',

  'solve(cos(x)=0,x)',
  '[-1/2*pi,1/2*pi]',

  'solve(tan(x)=1,x)',
  '1/4*pi',

  'solve(tan(x)=-1,x)',
  '-1/4*pi',

  'solve(tan(x)=0,x)',
  '0',

  // 2*x = pi/2
  'solve(sin(2*x)=1,x)',
  '1/4*pi',

  // 3*x = pi/6 or 5*pi/6
  'solve(2*sin(3*x)=1,x)',
  '[1/18*pi,5/18*pi]',

  // sin(x-pi/6) is kept as -sin(pi/6-x), so pi/6-x = -pi/6 or 7*pi/6:
  // sin(-pi-pi/6) = -sin(7*pi/6) = 1/2
  'solve(sin(x-pi/6)=1/2,x)',
  '[-pi,1/3*pi]',

  // (2*u+1)*(u-1): sin(x) = -1/2 or 1
  'solve(2*sin(x)^2-sin(x)-1,x)',
  '[-1/6*pi,1/2*pi,7/6*pi]',

  // cos(x) = +-1/sqrt(2)
  'solve(2*cos(x)^2-1=0,x)',
  '[-3/4*pi,-1/4*pi,1/4*pi,3/4*pi]',

  // cos(x) = +-1
  'solve(cos(x)^2=1,x)',
  '[0,pi]',

  // sin^2 = 1-cos^2: cos(x)*(1-cos(x)) = 0
  'solve(sin(x)^2+cos(x)=1,x)',
  '[-1/2*pi,0,1/2*pi]',

  'solve(sin(x)+x=1,x)',
  'Stop: solve: cannot solve the equation for x',

  // inverse trig
  'solve(arcsin(x)=pi/6,x)',
  '1/2',

  'solve(arctan(x)=pi/4,x)',
  '1',

  'solve(arccos(x)=0,x)',
  '1',

  // radicals: the candidates from squaring are checked in the original
  'solve(sqrt(x)=2,x)',
  '4',

  'solve(sqrt(x)=-2,x)',
  'Stop: solve: no solution',

  'solve(sqrt(x)=a,x)',
  'a^2',

  // x+1 = (x-1)^2 gives 0 and 3, sqrt(1) = -1 fails
  'solve(sqrt(x+1)=x-1,x)',
  '3',

  // 2*x+3 = x^2 gives -1 and 3, sqrt(1) = -1 fails
  'solve(sqrt(2*x+3)=x,x)',
  '3',

  'solve(sqrt(x^2+7)=4,x)',
  '[-3,3]',

  'solve(x^(1/3)=2,x)',
  '8',

  // u = sqrt(x): u^2+u-6 = (u+3)*(u-2), u = -3 gives x = 9 which fails
  'solve(x+sqrt(x)=6,x)',
  '4',

  // u = sqrt(x): u^2-2*u+1 = (u-1)^2
  'solve(2*sqrt(x)-x=1,x)',
  '1',

  'solve(sqrt(x)=x,x)',
  '[0,1]',

  // sqrt(x+5) = 1+sqrt(x), squared: 4 = 2*sqrt(x)
  'solve(sqrt(x+5)-sqrt(x)=1,x)',
  '4',

  // sqrt(x+4) = 5-sqrt(x-1), squared: 10*sqrt(x-1) = 20
  'solve(sqrt(x-1)+sqrt(x+4)=5,x)',
  '5',

  // absolute values
  'solve(abs(x)=2,x)',
  '[-2,2]',

  'solve(abs(x-1)=3,x)',
  '[-2,4]',

  'solve(abs(x)=-1,x)',
  'Stop: solve: no solution',

  'solve(abs(x)=0,x)',
  '0',

  'solve(abs(x)=a,x)',
  '[-a,a]',

  // 2*x+1 = x+2 gives 1, 2*x+1 = -(x+2) gives -1, both hold
  'solve(abs(2*x+1)=x+2,x)',
  '[-1,1]',

  // x-2 = 2*x gives -2 where abs(-4) = -4 fails, x-2 = -2*x gives 2/3
  'solve(abs(x-2)=2*x,x)',
  '2/3',

  // abs(x) = 1 or 2
  'solve(abs(x)^2-3*abs(x)+2,x)',
  '[-2,-1,1,2]',

  'solve(abs(x^2-4)=0,x)',
  '[-2,2]',

  // rational equations: the numerator is solved, poles are dropped
  'solve(1/x=2,x)',
  '1/2',

  'solve((x^2-1)/(x-1)=0,x)',
  '-1',

  'solve(1/(x-1)=1/(x+1),x)',
  'Stop: solve: no solution',

  // with other functions
  'solve(d(exp(2*x)-4*x,x),x)',
  '1/2*log(2)',

  'float(solve(exp(x)=2,x))',
  '0.693147...',

  'float(solve(sin(x)=1/2,x))',
  '[0.523599...,2.617994...]',

  'float(solve(x^2-2,x))',
  '[-1.414214...,1.414214...]',

  'float(roots(x^2-2))',
  '[-1.414214...,1.414214...]',

  'f(x)=exp(2*x)-5\nsolve(f(x)=0,x)',
  '1/2*log(5)',

  'subst(solve(exp(x)=3,x),x,exp(x))',
  '3',

  's=solve(sin(x)=1/2,x)\ns[2]',
  '5/6*pi',

  's=solve(sin(x)=1/2,x)\nsin(s[1])+sin(s[2])',
  '1',

  'simplify(subst(solve(sqrt(x+1)=x-1,x),x,sqrt(x+1)-(x-1)))',
  '0',

  // 1+x+x^2/2 = 1
  'solve(taylor(exp(x),x,2,0)=1,x)',
  '[-2,0]',

  // the variable is guessed
  'solve(log(x)=2)',
  'exp(2)',

  'solve(exp(x)=y,x)',
  'log(y)',

  'solve(y=exp(x),y)',
  'exp(x)',

  'solve(2*x+1=0,x)',
  '-1/2',

  'solve(3,x)',
  'Stop: solve: 1st argument does not contain the variable x',

  // assumptions filter the solutions
  'assume(x,positive)\nsolve(abs(x)=2,x)',
  '2',

  'forget(x)\nassume(x,negative)\nsolve(cos(x)=1/2,x)',
  '-1/3*pi',

  'forget(x)\nsolve(abs(x)=2,x)',
  '[-2,2]',

  // trig equations: a third argument names the integer of the solution family
  'solve(sin(x)=1/2,x,n)',
  '[1/6*pi+2*n*pi,5/6*pi+2*n*pi]',

  // +-1/2*pi+2*n*pi, merged: they differ by half a period (solve_general.ts)
  'solve(cos(x)=0,x,n)',
  '1/2*pi+n*pi',

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

  // large constants: a root is checked relative to the size of the terms
  // 7^15 = 4747561509943
  'solve(3^x=7^15,x)',
  'log(4747561509943)/log(3)',

  'solve(10^x=10^15+1,x)',
  'log(1000000000000001)/log(10)',

  // both real branches of Lambert W for an argument between -1/e and 0:
  // W-1(-1/4) = -2.1532923641, W0(-1/4) = -0.3574029562
  'solve(x*exp(x)=-1/4,x)',
  '[lambertw(-1/4,-1),lambertw(-1/4)]',

  'float(lambertw(-1/4,-1))',
  '-2.153292...',

  'float(lambertw(-1/10,-1))',
  '-3.577152...',

  'lambertw(-exp(-1),-1)',
  '-1',

  // the two branches meet at -1/e
  'solve(x*exp(x)=-exp(-1),x)',
  '-1',

  // x^x = 4/5 has the solutions 0.0946497109 and 0.7395336500
  'float(solve(x^x=4/5,x))',
  '[0.094650...,0.739534...]',

  // d/dx W = W/(x*(1+W)) on either branch
  'd(lambertw(x,-1),x)',
  'lambertw(x,-1)/(x+x*lambertw(x,-1))',
]);
