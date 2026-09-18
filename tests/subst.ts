import { run } from '../runtime/run';
import { run_test, setup_test, test } from '../test-harness';

run_test([
  'subst((-1)^(1/2),i,-3 + 10*3^(1/2)*i/9)',
  '-3+10/9*i*3^(1/2)',

  // subst(new, old, expr): the arguments are evaluated first
  'subst(2,x,x^2+1)',
  '5',

  'subst(y,x,x^2+x)',
  'y^2+y',

  'subst(a+b,x,x^2)',
  '2*a*b+a^2+b^2',

  'subst(x,x,x^2+1)',
  'x^2+1',

  'subst(1/2,x,x^2)',
  '1/4',

  'subst(0.5,x,x^2)',
  '0.25',

  'subst(-1,x,sqrt(x))',
  'i',

  'subst(0,x,sin(x)+cos(x))',
  '1',

  'subst(0,x,1/x)',
  'Stop: divide by zero',

  // x does not occur
  'subst(2,x,y+z)',
  'y+z',

  // subexpressions are replaced too
  'subst(z,x*y,x*y+1)',
  'z+1',

  'subst(z,sin(x),sin(x)^2+cos(x)^2)',
  'z^2+cos(x)^2',

  // swap two variables through a third one
  'subst(x,y,subst(y,x,x+2*y))',
  '3*x',

  // unknown functions
  'subst(2,x,f(x))',
  'f(2)',

  // a derivative that can be computed is computed first
  'subst(2,x,d(x^3,x))',
  '12',

  // renaming the variable of a derivative is fine
  'subst(x,t,d(y(t),t))',
  'd(y(x),x)',

  'subst(1,x,integral(x^2,x))',
  '1/3',

  'subst(2,t,defint(x*t,t,0,1))',
  '1/2*x',

  'subst(2,x,defint(x*t,t,0,1))',
  '1',

  // relations
  'subst(2,x,x==2)',
  '1',

  'subst(u,x,x+1==y)',
  'testeq(u+1,y)',

  // vectors
  'subst(3,x,[x,x^2])',
  '[3,9]',

  // user functions are expanded first
  'f(x)=x^2',
  '',

  'subst(3,x,f(x))',
  '9',

  'subst(3,x,f(y))',
  'y^2',
]);

// known bugs, not fixed here: subst substitutes the variable of an
// unevaluated derivative too, so the derivative is taken with respect
// to a number. subst(0,t,d(y(t),t)) should be the derivative of y at 0,
// not y(0).
setup_test(() =>
  test.failing('subst(0,t,d(y(t),t))', t =>
    t.not('y(0)', run('subst(0,t,d(y(t),t))'))
  )
);

// same bug: d(y(1),1) is then evaluated to 0
setup_test(() =>
  test.failing('subst(1,t,d(y(t),t))', t =>
    t.not('0', run('subst(1,t,d(y(t),t))'))
  )
);

// same bug: f(x) is unknown, so the result must still contain f
setup_test(() =>
  test.failing('subst(2,x,d(f(x),x)+x)', t =>
    t.not('2', run('subst(2,x,d(f(x),x)+x)'))
  )
);

// known bug: the index of a sum is a bound variable and must not be
// substituted; subst turns sum(f(k),k,1,n) into sum(f(2),2,1,n)
setup_test(() =>
  test.failing('subst(2,k,sum(f(k),k,1,n))', t =>
    t.is('sum(f(k),k,1,n)', run('subst(2,k,sum(f(k),k,1,n))'))
  )
);
