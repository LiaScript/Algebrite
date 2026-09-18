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
]);
