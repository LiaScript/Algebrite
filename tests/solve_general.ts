import { run_test } from '../test-harness';

// solve(eq, x, n): the general solution of a periodic equation, n names the
// integer of the families. Without n the principal solutions, as before.
//
//  - sin and cos give angle + 2*n*pi, tan gives angle + n*pi
//  - two families with the same period P whose offsets differ by exactly P/2
//    are merged into one with period P/2 (cos(x)=0: 1/2*pi+n*pi); the offset
//    of smaller absolute value is kept, the positive one on a tie. Only this
//    half period merge is done: 2*cos(x)^2+sin(x)=1 keeps three families,
//    although they are 1/2*pi+2/3*n*pi.
//  - the families are sorted by their value at n = 0
//  - while the equation is solved n is assumed to be an integer, so a family
//    that fails in the equation is dropped (sin(x)/(1+cos(x)) at x = pi);
//    the assumptions of the user about n are untouched afterwards
//  - a non periodic equation ignores n
// Every family was checked numerically at n = -2, 0, 3, 7 (mpmath).

run_test([
  'solve(sin(x)=1/2,x,n)',
  '[1/6*pi+2*n*pi,5/6*pi+2*n*pi]',

  // +-1/2*pi+2*n*pi differ by half a period
  'solve(cos(x)=0,x,n)',
  '1/2*pi+n*pi',

  'solve(tan(x)=1,x,k)',
  '1/4*pi+k*pi',

  // 2*x = 2*n*pi or pi+2*n*pi
  'solve(sin(2*x)=0,x,n)',
  '1/2*n*pi',

  // 3*x+1 = +-1/3*pi+2*n*pi
  'solve(cos(3*x+1)=1/2,x,n)',
  '[-1/3-1/9*pi+2/3*n*pi,-1/3+1/9*pi+2/3*n*pi]',

  // sin(x) = +-1/2: -1/6*pi and 5/6*pi merge, 1/6*pi and 7/6*pi merge
  'solve(sin(x)^2=1/4,x,n)',
  '[-1/6*pi+n*pi,1/6*pi+n*pi]',

  'solve(sin(x)=2,x,n)',
  'Stop: solve: no solution',

  'solve(cos(x)=-3/2,x,n)',
  'Stop: solve: no solution',

  'solve(exp(x)=2,x,n)',
  'log(2)',
]);

run_test([
  // the values where both angles coincide
  'solve(sin(x)=0,x,n)',
  'n*pi',

  'solve(sin(x)=1,x,n)',
  '1/2*pi+2*n*pi',

  'solve(sin(x)=-1,x,n)',
  '-1/2*pi+2*n*pi',

  'solve(cos(x)=1,x,n)',
  '2*n*pi',

  'solve(cos(x)=-1,x,n)',
  'pi+2*n*pi',

  'solve(cos(x)=1/2,x,n)',
  '[-1/3*pi+2*n*pi,1/3*pi+2*n*pi]',

  'solve(sin(x)=-1/2*sqrt(3),x,n)',
  '[-1/3*pi+2*n*pi,4/3*pi+2*n*pi]',

  'solve(tan(x)=0,x,n)',
  'n*pi',

  // sin(x) = +-1
  'solve(sin(x)^2=1,x,n)',
  '1/2*pi+n*pi',

  // cos(x) = +-1/2
  'solve(cos(x)^2=1/4,x,n)',
  '[-1/3*pi+n*pi,1/3*pi+n*pi]',

  // sin(x) = +-1/2*sqrt(2), i.e. cos(2*x) = 0: four families merge to two,
  // +-1/4*pi+n*pi, and these merge once more
  'solve(sin(x)^2=1/2,x,n)',
  '1/4*pi+1/2*n*pi',

  'solve(cos(x)^2=1,x,n)',
  'n*pi',

  'solve(abs(sin(x))=1/2,x,n)',
  '[-1/6*pi+n*pi,1/6*pi+n*pi]',

  // tan(x) = +-sqrt(3): period pi, the offsets differ by 2/3*pi, no merge
  'solve(tan(x)^2=3,x,n)',
  '[-1/3*pi+n*pi,1/3*pi+n*pi]',
]);

run_test([
  // linear arguments
  'solve(tan(3*x)=sqrt(3),x,n)',
  '1/9*pi+1/3*n*pi',

  'solve(sin(x/2)=1/2,x,n)',
  '[1/3*pi+4*n*pi,5/3*pi+4*n*pi]',

  'solve(sin(x+pi/4)=1,x,n)',
  '1/4*pi+2*n*pi',

  'solve(cos(2*x)=-1/2,x,n)',
  '[-1/3*pi+n*pi,1/3*pi+n*pi]',

  'solve(sin(2*x)=1,x,n)',
  '1/4*pi+n*pi',

  'solve(sin(3*x)=0,x,n)',
  '1/3*n*pi',

  'solve(cos(pi*x)=0,x,n)',
  '1/2+n',

  'solve(tan(x/2)=1,x,n)',
  '1/2*pi+2*n*pi',

  // cos(x) = cos(1): x = +-1+2*n*pi
  'solve(cos(x)=cos(1),x,n)',
  '[-1+2*n*pi,1+2*n*pi]',

  // other names
  'solve(sin(t)=1/2,t,m)',
  '[1/6*pi+2*m*pi,5/6*pi+2*m*pi]',

  'solve(cos(y)=0,y,j)',
  '1/2*pi+j*pi',

  // a polynomial in the kernel
  // sin(x) = 0 or 1
  'solve(sin(x)^2=sin(x),x,n)',
  '[n*pi,1/2*pi+2*n*pi]',

  // 2*(1-s^2)+s = 1: sin(x) = 1 or -1/2. Thirds of a period are not merged
  'solve(2*cos(x)^2+sin(x)=1,x,n)',
  '[-1/6*pi+2*n*pi,1/2*pi+2*n*pi,7/6*pi+2*n*pi]',

  // a*sin+b*cos = 0 is a tangent equation
  'solve(sin(x)=cos(x),x,n)',
  '1/4*pi+n*pi',

  // the kernel inside another function
  'solve(exp(sin(x))=1,x,n)',
  'n*pi',

  'solve(log(cos(x))=0,x,n)',
  '2*n*pi',
]);

run_test([
  // symbolic right hand side and frequency
  'solve(sin(x)=a,x,n)',
  '[arcsin(a)+2*n*pi,pi-arcsin(a)+2*n*pi]',

  'solve(cos(x)=a,x,n)',
  '[arccos(a)+2*n*pi,-arccos(a)+2*n*pi]',

  'solve(tan(x)=a,x,n)',
  'arctan(a)+n*pi',

  // offsets 0 and pi/a, period 2*pi/a
  'solve(sin(a*x)=0,x,n)',
  'n*pi/a',
]);

run_test([
  // a family that fails in the equation: at x = pi+2*n*pi the denominator
  // vanishes, which is only seen with n an integer
  'solve(sin(x)/(1+cos(x))=0,x,n)',
  '2*n*pi',

  'solve(sin(x)/(1+cos(x))=0,x)',
  '0',

  // cos(x) = 0 is excluded by the denominator
  'solve(cos(x)*sin(x)/cos(x)^2=0,x,n)',
  'n*pi',
]);

run_test([
  // every family holds for n = -2, 0, 3
  'r=solve(sin(x)=1/2,x,n)',
  '',

  'abs(float(sin(subst(-2,n,r[1])))-1/2)<10^(-9)',
  '1',

  'abs(float(sin(subst(0,n,r[1])))-1/2)<10^(-9)',
  '1',

  'abs(float(sin(subst(3,n,r[1])))-1/2)<10^(-9)',
  '1',

  'abs(float(sin(subst(-2,n,r[2])))-1/2)<10^(-9)',
  '1',

  'abs(float(sin(subst(0,n,r[2])))-1/2)<10^(-9)',
  '1',

  'abs(float(sin(subst(3,n,r[2])))-1/2)<10^(-9)',
  '1',

  'r=solve(cos(x)=0,x,n)',
  '',

  'abs(float(cos(subst(-2,n,r))))<10^(-9)',
  '1',

  'abs(float(cos(subst(0,n,r))))<10^(-9)',
  '1',

  'abs(float(cos(subst(3,n,r))))<10^(-9)',
  '1',

  'r=solve(cos(3*x+1)=1/2,x,n)',
  '',

  'abs(float(cos(3*subst(-2,n,r[1])+1))-1/2)<10^(-9)',
  '1',

  'abs(float(cos(3*subst(0,n,r[1])+1))-1/2)<10^(-9)',
  '1',

  'abs(float(cos(3*subst(3,n,r[2])+1))-1/2)<10^(-9)',
  '1',

  'r=solve(sin(x)^2=1/4,x,n)',
  '',

  'abs(float(sin(subst(-2,n,r[1]))^2)-1/4)<10^(-9)',
  '1',

  'abs(float(sin(subst(3,n,r[1]))^2)-1/4)<10^(-9)',
  '1',

  'abs(float(sin(subst(-2,n,r[2]))^2)-1/4)<10^(-9)',
  '1',

  'abs(float(sin(subst(3,n,r[2]))^2)-1/4)<10^(-9)',
  '1',

  'r=solve(sin(2*x)=0,x,n)',
  '',

  'abs(float(sin(2*subst(-2,n,r))))<10^(-9)',
  '1',

  'abs(float(sin(2*subst(3,n,r))))<10^(-9)',
  '1',

  // exactly, once n is an integer
  'assume(n,integer)',
  '',

  'sin(2*r)',
  '0',

  'tan(solve(tan(x)=1,x,n))',
  '1',

  'r=solve(cos(3*x+1)=1/2,x,n)',
  '',

  'cos(3*r[1]+1)',
  '1/2',

  'cos(3*r[2]+1)',
  '1/2',

  'r=solve(sin(x)^2=1/4,x,n)',
  '',

  'sin(r[1])^2',
  '1/4',

  'sin(r[2])^2',
  '1/4',

  'forget(n)',
  '',
]);

run_test([
  // the assumptions about n are those of the user, before and after
  'solve(cos(x)=0,x,n)',
  '1/2*pi+n*pi',

  'isinteger(n)',
  'isinteger(n)',

  'assume(n,positive)',
  '',

  'solve(sin(x)/(1+cos(x))=0,x,n)',
  '2*n*pi',

  'ispositive(n)',
  '1',

  'isinteger(n)',
  'isinteger(n)',

  'forget(n)',
  '',

  // n already an integer: it stays one
  'assume(n,integer)',
  '',

  'solve(tan(x)=1,x,n)',
  '1/4*pi+n*pi',

  'isinteger(n)',
  '1',

  'forget(n)',
  '',

  // float(solve(...)) converts the families afterwards
  'float(solve(sin(x)=1/2,x,n))',
  '[0.523599...+6.283185...*n,2.617994...+6.283185...*n]',

  // assumptions about x: the sign of a family is unknown, it stays
  'assume(x,positive)',
  '',

  'solve(sin(x)=1/2,x,n)',
  '[1/6*pi+2*n*pi,5/6*pi+2*n*pi]',

  'solve(sin(x)=1/2,x)',
  '[1/6*pi,5/6*pi]',

  'forget(x)',
  '',
]);

run_test([
  // the parameter has to be a symbol that is free in the equation
  'solve(sin(n*x)=0,x,n)',
  'Stop: solve: the parameter n occurs in the equation',

  'solve(sin(x)=1/2,x,x)',
  'Stop: solve: the parameter x occurs in the equation',

  'solve(sin(x)=1/2,x,1/2)',
  'Stop: solve: 3rd argument must be a symbol',

  'solve(sin(x)=1/2,x,a+b)',
  'Stop: solve: 3rd argument must be a symbol',

  'solve(sin(x)=1/2,x,pi)',
  'Stop: solve: 3rd argument must be a symbol',

  // a symbol with a value is that value
  'm=3',
  '',

  'solve(sin(x)=1/2,x,m)',
  'Stop: solve: 3rd argument must be a symbol',
]);

run_test([
  // ---- must not change ----
  // two arguments: the principal solutions
  'solve(sin(x)=1/2,x)',
  '[1/6*pi,5/6*pi]',

  'solve(cos(x)=0,x)',
  '[-1/2*pi,1/2*pi]',

  'solve(tan(x)=1,x)',
  '1/4*pi',

  'solve(sin(2*x)=0,x)',
  '[0,1/2*pi]',

  'solve(sin(x)^2=1/4,x)',
  '[-1/6*pi,1/6*pi,5/6*pi,7/6*pi]',

  'solve(sin(x)=2,x)',
  'Stop: solve: no solution',

  // not periodic: n is ignored
  'solve(x^2=4,x,n)',
  '[-2,2]',

  'solve(abs(x)=2,x,n)',
  '[-2,2]',

  'solve(log(x)=1,x,n)',
  'e',

  'solve(sqrt(x)=3,x,n)',
  '9',

  'solve(arctan(x)=pi/4,x,n)',
  '1',

  'solve(2^x=8,x,n)',
  '3',

  // systems and inequalities
  'solve([x+y=3,x-y=1],[x,y])',
  '[2,1]',

  'solve([x+y=3,x-y=1])',
  '[2,1]',

  'solve([x^2+y^2=25,x-y=1],[x,y])',
  '[[-3,-4],[4,3]]',

  'solve(x^2<4,x)',
  'and(x>-2,x<2)',

  // assumptions about the unknown
  'assume(x,negative)',
  '',

  'solve(cos(x)=1/2,x)',
  '-1/3*pi',

  'forget(x)',
  '',
]);
