import { run_test } from '../test-harness';

run_test([
  'solve(x^2-4,x)',
  '[-2,2]',

  'solve(x^2-4==0,x)',
  '[-2,2]',

  'solve(x-4,x)',
  '4',

  'solve(a*x+b,x)',
  '-b/a',

  'solve(x^2+1,x)',
  '[-i,i]',

  // Linear systems: solve([eq1, eq2, ...], [x, y, ...]) returns the values
  // in variable order. Equations are expressions (= 0) or use = / ==.
  'solve([x+y-3,x-y-1],[x,y])',
  '[2,1]',

  'solve([x+y==3,x-y==1],[x,y])',
  '[2,1]',

  'solve([2*x+3*y-4,x-y-2],[x,y])',
  '[2,0]',

  'solve([x+y+z-6,x-y+z-2,2*x+y-z-1],[x,y,z])',
  '[1,2,3]',

  'solve([2*x-1],[x])',
  '[1/2]',

  'solve([x+y-a,2*x+y-b],[x,y])',
  '[-a+b,2*a-b]',

  'solve([a*x+b*y-u,c*x+k*y-v],[x,y])',
  '[-b*v/(a*k-b*c)+k*u/(a*k-b*c),a*v/(a*k-b*c)-c*u/(a*k-b*c)]',

  'solve([x+y-1,2*x+2*y-2],[x,y])',
  'Stop: solve: system has no unique solution',

  'solve([x*y-1,x-y],[x,y])',
  'Stop: solve: system is not linear in the given variables',

  'solve([x+y-1],[x,y])',
  'Stop: solve: need as many equations as variables',

  'solve([x+y=3,x-y=1],[x,y])',
  '[2,1]',

  'solve([x+y+z=6,x-y+z=2,2*x+y-z=1],[x,y,z])',
  '[1,2,3]',

  // = in a list must not define a function as a side effect
  'x+y',
  'x+y',

  // Without a variable list: variables in order of first appearance.
  'solve([x+y=3,x-y=1])',
  '[2,1]',

  'solve([2*b+a=5,a-b=-1])',
  '[1,2]',

  'solve([x+y=3])',
  'Stop: solve: need as many equations as variables',

  // a single variable is a one element list, not a request to guess
  'solve([x+y=3,x-y=1],y)',
  'Stop: solve: need as many equations as variables',

  'solve([x+1=3],x)',
  '[2]',

  'solve([x+y=3,x-y=1],[x,2])',
  'Stop: solve: variables must be distinct symbols',

  'solve([x+y=3,x-y=1],[x,x])',
  'Stop: solve: variables must be distinct symbols',

  // results follow the order of the variable list
  'solve([x+y=3,x-y=1],[y,x])',
  '[1,2]',

  // inconsistent
  'solve([x+y=2,x+y=3],[x,y])',
  'Stop: solve: system has no unique solution',

  'solve([x+y+z=1,x+y+z=2,x-y=0],[x,y,z])',
  'Stop: solve: system has no unique solution',

  // dependent
  'solve([x+2*y=5,3*x+6*y=15],[x,y])',
  'Stop: solve: system has no unique solution',

  'solve([x+1],[y])',
  'Stop: solve: system has no unique solution',

  'solve([sin(x)+y=1,x-y=0],[x,y])',
  'Stop: solve: system is not linear in the given variables',

  'solve([x=1,y=2],[x,y])',
  '[1,2]',

  // 1/2*19/15+1/3*11/10 = 1, 19/15-11/10 = 1/6
  'solve([1/2*x+1/3*y=1,x-y=1/6],[x,y])',
  '[19/15,11/10]',

  // one equation with a symbolic coefficient: inv of a 1x1 matrix, whose
  // adjugate needs the determinant of the empty matrix
  'solve([a*x=1],[x])',
  '[1/a]',

  'solve([exp(1)*x=1],[x])',
  '[exp(-1)]',

  // Cramer: x = (c*f-b*g)/(a*f-b*d), y = (a*g-c*d)/(a*f-b*d)
  'solve([a*x+b*y=c,d*x+f*y=g],[x,y])',
  '[-b*g/(a*f-b*d)+c*f/(a*f-b*d),a*g/(a*f-b*d)-c*d/(a*f-b*d)]',

  // x = y = 1/(1+2^(1/2))
  'solve([sqrt(2)*x+y=1,x-y=0],[x,y])',
  '[-1/(-1-2^(1/2)),-1/(-1-2^(1/2))]',

  'solve([a*x=1,b*y=1],[x,y])',
  '[1/a,1/b]',

  // x = y = 1/(1+a)
  'solve([a*x+y=1,x-y=0],[x,y])',
  '[-1/(-1-a),-1/(-1-a)]',

  'solve([x+y=1.5,x-y=0.5],[x,y])',
  '[1.0,0.5]',

  // x = y, (1+i)*x = 1
  'solve([x+i*y=1,x-y=0],[x,y])',
  '[1/2-1/2*i,1/2-1/2*i]',

  // pi is a constant, not a variable
  'solve([x+pi=1])',
  '[1-pi]',

  'solve([x=y+1,y=2])',
  '[3,2]',

  'solve([2=x+y,x=y])',
  '[1,1]',

  'x',
  'x',

  'y',
  'y',

  // single equations
  'solve(x^2-2*x+1,x)',
  '1',

  'solve(x^3-6*x^2+11*x-6,x)',
  '[1,2,3]',

  'solve(x=5,x)',
  '5',

  'solve(2*x=x+1,x)',
  '1',

  'solve(x^2=4)',
  '[-2,2]',

  'solve(x^2==-1)',
  '[-i,i]',

  // (-1+2*i)^2+2*(-1+2*i)+5 = -3-4*i-2+4*i+5 = 0
  'solve(x^2+2*x+5,x)',
  '[-1-2*i,-1+2*i]',

  // (i*(-b/a)^(1/2))^2 = b/a
  'solve(a*x^2-b,x)',
  '[-i*(-b/a)^(1/2),i*(-b/a)^(1/2)]',

  'solve(sin(x),x)',
  'Stop: solve: 1st argument is not a polynomial in the variable x — solve() currently only supports polynomial equations',

  'solve(3,x)',
  'Stop: solve: 1st argument is not a polynomial in the variable x — solve() currently only supports polynomial equations',
]);
