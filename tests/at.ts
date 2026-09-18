import { run_test } from '../test-harness';

// A derivative at a point: subst of a number or expression for the
// differentiation variable. For an unknown function of one variable it
// prints (and can be typed) as y'(0), otherwise as at(expr, var, value).
run_test([
  'subst(0,t,d(y(t),t))',
  "y'(0)",

  'subst(0,t,d(y(t),t,2))',
  "y''(0)",

  'subst(2*s,t,d(y(t),t))',
  "y'(2*s)",

  'subst(1,t,d(y(t),t))',
  "y'(1)",

  'subst(0,t,y(t)+d(y(t),t))',
  "y'(0)+y(0)",

  'subst(2,x,d(f(x),x)+x)',
  "2+f'(2)",

  // a free symbol just renames the variable
  'subst(a,t,d(y(t),t))',
  'd(y(a),a)',

  // unless it already occurs, then renaming would capture it
  'subst(a,t,d(y(t,a),t))',
  'at(d(y(t,a),t),t,a)',

  // not a function of the variable alone: the general form
  'subst(0,t,d(f(t^2),t))',
  'at(d(f(t^2),t),t,0)',

  // other symbols in the derivative are substituted as usual
  'subst(3,a,d(y(t,a),t))',
  'd(y(t,3),t)',

  // typed in
  "y'(0)",
  "y'(0)",

  "y''(3)",
  "y''(3)",

  "y'(a)",
  'd(y(a),a)',

  "subst(5,a,y'(a))",
  "y'(5)",

  "subst(1,y'(0),subst(0,t,d(y(t),t))+5)",
  '6',

  "y'(0)-subst(0,t,d(y(t),t))",
  '0',

  "printlatex(y''(0))",
  "y''(0)",

  'at(t^2+1,t,3)',
  '10',

  'at(d(y(t),t),t,0)',
  "y'(0)",

  "at(d(y(t),t),t,a)",
  'd(y(a),a)',

  // bound variables stay, only the bounds are substituted
  'subst(2,k,sum(f(k),k,1,n))',
  'sum(f(k),k,1,n)',

  'subst(3,n,sum(f(k),k,1,n))',
  'f(1)+f(2)+f(3)',

  'subst(2,k,product(f(k),k,1,n))',
  'product(f(k),k,1,n)',

  'subst(4,n,product(k,k,1,n))',
  '24',

  // once the function is known, the value is computed
  'y(t)=t^3',
  '',

  "y'(2)",
  '12',

  "y''(1)",
  '6',

  'subst(0,t,d(g(t),t))',
  "g'(0)",

  'g(t)=sin(t)',
  '',

  "g'(0)",
  '1',
]);
