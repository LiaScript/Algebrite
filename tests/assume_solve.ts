import { run_test } from '../test-harness';

// solve, roots, nroots and nsolve drop the solutions known to violate the
// assumptions about the unknown. A solution that can't be decided stays.
// With nothing left the result is a stop, as for an unsolvable polynomial.
run_test([
  'assume(x>0)',
  '',

  // x = -2 is not positive
  'solve(x^2=4,x)',
  '2',

  'roots(x^2-4,x)',
  '2',

  // 0 is not positive either
  'solve(x^2-2*x,x)',
  '2',

  // the complex roots of x^3 = 1 are not real, so not positive
  'solve(x^3=1,x)',
  '1',

  // the signs of the roots depend on a: both stay
  'solve(x^2=a,x)',
  '[-a^(1/2),a^(1/2)]',

  'forget(x)',
  '',

  // x >= 0 keeps the root 0
  'assume(x>=0)',
  '',

  'solve(x^2+2*x,x)',
  '0',

  'forget(x)',
  '',

  'assume(x<0)',
  '',

  'solve(x^3-x,x)',
  '-1',

  'forget(x)',
  '',

  'assume(x!=0)',
  '',

  'solve(x^3-x,x)',
  '[-1,1]',

  'forget(x)',
  '',

  // explicitly real: no real root
  'assume(x,real)',
  '',

  'solve(x^2+1,x)',
  'Stop: solve: no solution satisfies the assumptions about x',

  'roots(x^2+1,x)',
  'Stop: roots: no solution satisfies the assumptions about x',

  // real, but the sign of a is unknown: the roots stay
  'solve(x^2=a,x)',
  '[-a^(1/2),a^(1/2)]',

  'forget(x)',
  '',

  'assume(n,integer)',
  '',

  'solve(2*n=3,n)',
  'Stop: solve: no solution satisfies the assumptions about n',

  'solve(n^2=4,n)',
  '[-2,2]',

  'solve(4*n^2=1,n)',
  'Stop: solve: no solution satisfies the assumptions about n',

  'forget(n)',
  '',
]);

// assumptions about the coefficients help decide
run_test([
  // with a > 0, (-a)^(1/2) = i*a^(1/2): the roots of x^2 = a are real
  'assume(a>0)',
  '',

  'sqrt(-4*a)',
  '2*i*a^(1/2)',

  'solve(x^2=a,x)',
  '[-a^(1/2),a^(1/2)]',

  'assume(x>0)',
  '',

  'solve(x^2=a,x)',
  'a^(1/2)',

  'forget()',
  '',

  // with a >= 0, -a^(1/2) is <= 0 and never positive; a^(1/2) might be 0
  // (for a = 0), which is unknown, so it stays
  'assume(a>=0)',
  '',

  'assume(x>0)',
  '',

  'solve(x^2=a,x)',
  'a^(1/2)',

  'isnegative(-a^(1/2))',
  'isnegative(-a^(1/2))',

  'ispositive(-a^(1/2))',
  '0',

  'forget()',
  '',
]);

// linear systems: a unique solution that violates an assumption is none
run_test([
  'assume(x>0)',
  '',

  'solve([x+y=3,x-y=1],[x,y])',
  '[2,1]',

  'assume(y<0)',
  '',

  'solve([x+y=3,x-y=1],[x,y])',
  'Stop: solve: no solution satisfies the assumptions about y',

  // x = 4, y = -1
  'solve([x+y=3,x-y=5],[x,y])',
  '[4,-1]',

  'forget()',
  '',
]);

// polynomial systems: rows that violate an assumption are dropped
run_test([
  'assume(x>0)',
  '',

  // y = x, x^2 = 1
  'solve([x*y-1,x-y],[x,y])',
  '[[1,1]]',

  'assume(y<0)',
  '',

  'solve([x*y-1,x-y],[x,y])',
  'Stop: solve: no solution satisfies the assumptions about x,y',

  'forget()',
  '',
]);

// numeric roots are checked numerically
run_test([
  'assume(x>0)',
  '',

  'nroots(x^3-x)',
  '1.000000...',

  'forget(x)',
  '',

  'assume(x,real)',
  '',

  'nroots(x^2+1)',
  'Stop: nroots: no solution satisfies the assumptions about x',

  'forget(x)',
  '',

  'assume(n,integer)',
  '',

  // both roots stay; compared by value, since nroots starts from random
  // values and may hit 2 exactly (printed 2.0 instead of 2.000000...)
  'r=nroots(n^2-4,n)',
  '',

  'and(abs(r[1]+2)<10^(-6),abs(r[2]-2)<10^(-6))',
  '1',

  'nroots(2*n-3,n)',
  'Stop: nroots: no solution satisfies the assumptions about n',

  'forget(n)',
  '',

  'assume(x<0)',
  '',

  'nsolve(x^2-4,x,-1)',
  '-2.0',

  'nsolve(x^2-4,x,[0,5])',
  'Stop: nsolve: the root found contradicts the assumptions about x, try another start value',

  'forget(x)',
  '',
]);

// without assumptions everything stays as before
run_test([
  'solve(x^2+1,x)',
  '[-i,i]',

  'solve(x^2=a,x)',
  '[-a^(1/2),a^(1/2)]',

  'solve(2*n=3,n)',
  '3/2',

  'solve(x^3-x,x)',
  '[-1,0,1]',

  'nroots(x^2+1)',
  '[-1.000000...*i,1.000000...*i]',
]);
