import { run_test } from '../test-harness';

// piecewise(value1, condition1, value2, condition2, ..., [default])
//
// The conditions are tested in order. The first one that is true selects
// its value, a false one drops its branch, an undecided one keeps the
// branch symbolic. A trailing unpaired argument is the otherwise-value.
// piecewise is a soft builtin: a definition of the user's own wins.
//
// Decisions documented here:
// - a condition is a comparison, and/or/not of conditions, 0, 1, or
//   something still symbolic (a symbol, an unknown function). Any other
//   number, a sum, a product or a power stops with a message: the usual
//   cause is the argument order of if(condition, value, ...).
// - when every condition is false and there is no default the function has
//   no value there: Stop.
// - the derivative is taken branch by branch with the conditions kept.
//   Whether the function is differentiable AT a break point is not decided:
//   d(piecewise(-x,x<0,x),x) gives piecewise(-1,x<0,1), which claims the
//   value 1 at x=0 where abs is not differentiable.
// - defint splits the interval at the break points of the conditions that
//   are linear in x with numeric coefficients (x<2, 2*x<=1, and(0<=x,x<1))
//   and integrates the active branch of every piece. Other conditions
//   (x<a, x^2<1) leave the defint unevaluated.
// - integral gives the CONTINUOUS antiderivative: the branch-wise
//   antiderivatives with the constants that make them join at the break
//   points, written with x<c conditions. When the break points cannot be
//   found it stays integral(piecewise(...),x), without a Stop.

// ---- evaluation at numbers: both sides of and exactly at the break points
run_test([
  'f(x)=piecewise(x^2,x<0,x,x<=2,4)',
  '',

  // symbolic argument: stays as the call
  'f(x)',
  'piecewise(x^2,x<0,x,x<=2,4)',

  'f(-2)',
  '4',

  // x<0 is strict: 0 belongs to the second branch
  'f(0)',
  '0',

  'f(1)',
  '1',

  // x<=2 is not strict: 2 belongs to the second branch
  'f(2)',
  '2',

  'f(3)',
  '4',

  'f(-1/2)',
  '1/4',

  'f(1/2)',
  '1/2',

  'f(5/2)',
  '4',

  'f(-1.5)',
  '2.25',

  'f(0.5)',
  '0.5',

  'f(2.0)',
  '2.0',

  'f(2.001)',
  '4',

  // irrational arguments are decided numerically
  'f(-sqrt(2))',
  '2',

  'f(pi)',
  '4',

  'f(exp(1)-1)',
  '-1+e',
]);

// ---- strict and non-strict comparisons, > and >=, ==
run_test([
  'h(x)=piecewise(10,x<1,20,x<=2,30)',
  '',

  'h(0.999)',
  '10',

  'h(1)',
  '20',

  'h(2)',
  '20',

  'h(2.001)',
  '30',

  'k(x)=piecewise(1,x>2,2,x>=1,3)',
  '',

  'k(3)',
  '1',

  'k(2)',
  '2',

  'k(1)',
  '2',

  'k(1/2)',
  '3',

  'k(5/2)',
  '1',

  // the sign function written as cases
  's(x)=piecewise(-1,x<0,0,x==0,1)',
  '',

  's(-3)',
  '-1',

  's(0)',
  '0',

  's(7)',
  '1',

  // the constant on the left of the comparison
  'piecewise(a,0<=x,b)',
  'piecewise(a,0<=x,b)',

  'eval(piecewise(a,0<=x,b),x,0)',
  'a',

  'eval(piecewise(a,0<x,b),x,0)',
  'b',
]);

// ---- and / or / not
run_test([
  'u(x)=piecewise(1,and(0<=x,x<=1),0)',
  '',

  'u(0)',
  '1',

  'u(1)',
  '1',

  'u(1/2)',
  '1',

  'u(-1)',
  '0',

  'u(2)',
  '0',

  'v(x)=piecewise(1,or(x<-1,x>1),0)',
  '',

  'v(-2)',
  '1',

  'v(-1)',
  '0',

  'v(0)',
  '0',

  'v(3)',
  '1',

  'w(x)=piecewise(1,not(x<0),0)',
  '',

  'w(0)',
  '1',

  'w(-1)',
  '0',

  // decided parts of an and/or disappear
  'piecewise(1,and(2>1,x<1),0)',
  'piecewise(1,x<1,0)',

  'piecewise(1,or(2<1,x<1),0)',
  'piecewise(1,x<1,0)',

  'piecewise(1,and(2<1,x<1),0)',
  '0',

  'piecewise(1,or(2>1,x<1),0)',
  '1',
]);

// ---- conditions that are always true or false, overlapping conditions
run_test([
  'piecewise(x,1<0,y)',
  'y',

  'piecewise(a,1<0,b,x<0,c)',
  'piecewise(b,x<0,c)',

  // a true condition ends the list: its value becomes the default
  'piecewise(a,x<0,b,2>1,c)',
  'piecewise(a,x<0,b)',

  'piecewise(a,x<0,b,2>1,c,x<5,d)',
  'piecewise(a,x<0,b)',

  'piecewise(a,1,b)',
  'a',

  'piecewise(a,0,b)',
  'b',

  // only a default
  'piecewise(7)',
  '7',

  'piecewise(x+x)',
  '2*x',

  // the values are evaluated
  'piecewise(x+x,x<0,x*x)',
  'piecewise(2*x,x<0,x^2)',

  // the same value everywhere
  'piecewise(a,x<0,a)',
  'a',

  // no default: not the same as a everywhere
  'piecewise(a,x<0,a,x<1)',
  'piecewise(a,x<0,a,x<1)',

  // overlapping conditions: the first one wins
  'eval(piecewise(1,x<5,2,x<10,3),x,3)',
  '1',

  'eval(piecewise(1,x<5,2,x<10,3),x,7)',
  '2',

  'eval(piecewise(1,x<10,2,x<5,3),x,3)',
  '1',

  // no default, undecided: stays
  'piecewise(x,x<0)',
  'piecewise(x,x<0)',

  'eval(piecewise(x,x<0),x,-3)',
  '-3',

  // a value that does not exist in a branch that is not taken
  'eval(piecewise(1/x,x>0,0),x,0)',
  '0',
]);

// ---- malformed calls
run_test([
  'piecewise()',
  'Stop: piecewise: expected value1, condition1, ..., [default]',
]);

run_test([
  // no condition holds and no default: no value
  'eval(piecewise(x,x<0),x,3)',
  'Stop: piecewise: no condition holds and there is no default value',
]);

run_test([
  'piecewise(x,2,y)',
  'Stop: piecewise: 2 is not a condition, the arguments are value1, condition1, ..., [default]',
]);

run_test([
  // the argument order of if(condition, value, ...)
  'piecewise(x<0,-x,x)',
  'Stop: piecewise: -x is not a condition, the arguments are value1, condition1, ..., [default]',
]);

run_test([
  'piecewise(x,x+1,y)',
  'Stop: piecewise: x+1 is not a condition, the arguments are value1, condition1, ..., [default]',
]);

run_test([
  // a symbol may become a condition later
  'piecewise(x,c,y)',
  'piecewise(x,c,y)',

  'c=quote(z<3)',
  '',

  'piecewise(x,c,y)',
  'piecewise(x,z<3,y)',

  'z=1',
  '',

  'piecewise(x,c,y)',
  'x',
]);

// ---- symbolic break points, assumptions
run_test([
  'piecewise(1,x<a,2)',
  'piecewise(1,x<a,2)',

  'eval(piecewise(1,x<a,2),x,3)',
  'piecewise(1,3<a,2)',

  'eval(eval(piecewise(1,x<a,2),x,3),a,5)',
  '1',

  'eval(eval(piecewise(1,x<a,2),x,3),a,3)',
  '2',

  'assume(a,positive)',
  '',

  'eval(piecewise(1,x<a,2),x,-1)',
  '1',

  'eval(piecewise(1,x<a,2),x,0)',
  '1',

  'eval(piecewise(1,x<a,2),x,3)',
  'piecewise(1,3<a,2)',

  'assume(x,positive)',
  '',

  // abs(x) written as cases
  'piecewise(-x,x<0,x)',
  'x',

  'piecewise(-x,x<0,x,x>0,0)',
  'x',

  // x > 0 says nothing about x < 1
  'piecewise(-x,x<1,x)',
  'piecewise(-x,x<1,x)',
]);

run_test([
  'assume(x,negative)',
  '',

  'piecewise(-x,x<0,x)',
  '-x',

  'piecewise(-x,x<=0,x)',
  '-x',

  // a value bound to the break point
  'a=5',
  '',

  'piecewise(1,y<a,2)',
  'piecewise(1,y<5,2)',
]);

// ---- user functions with two arguments, nesting, other variable names
run_test([
  // excess of t over the allowance a
  'T(t,a)=piecewise(0,t<a,t-a)',
  '',

  'T(3,1)',
  '2',

  'T(1,3)',
  '0',

  'T(2,2)',
  '0',

  'T(t,0)',
  'piecewise(0,t<0,t)',

  'T(5/2,1/2)',
  '2',

  'T(y,z)',
  'piecewise(0,y<z,y-z)',

  'n(x)=piecewise(piecewise(1,x<-1,2),x<0,3)',
  '',

  'n(x)',
  'piecewise(piecewise(1,x<-1,2),x<0,3)',

  'n(-2)',
  '1',

  'n(-1)',
  '2',

  'n(-1/2)',
  '2',

  'n(0)',
  '3',

  // a piecewise function of a piecewise function
  'f(x)=piecewise(x^2,x<0,x,x<=2,4)',
  '',

  'f(f(-2))',
  '4',

  'f(f(1))',
  '1',

  'f(f(-1))',
  '1',
]);

// ---- arithmetic, eval at a point, subst, float
run_test([
  'p=piecewise(x^2,x<0,x,x<=2,4)',
  '',

  '2*p+1',
  '1+2*piecewise(x^2,x<0,x,x<=2,4)',

  'eval(2*p+1,x,3)',
  '9',

  'eval(2*p+1,x,-2)',
  '9',

  'eval(2*p+1,x,1)',
  '3',

  'eval(p^2,x,-2)',
  '16',

  'eval(1/p,x,3)',
  '1/4',

  'p-p',
  '0',

  'p+p',
  '2*piecewise(x^2,x<0,x,x<=2,4)',

  'subst(3,x,p)',
  '4',

  'subst(y,x,p)',
  'piecewise(y^2,y<0,y,y<=2,4)',

  'eval(p*piecewise(1,x<1,-1),x,3)',
  '-4',

  'eval(p*piecewise(1,x<1,-1),x,-3)',
  '9',

  'float(eval(p,x,1/2))',
  '0.5',

  'float(piecewise(x/2,x<0,1/4))',
  'piecewise(0.5*x,x<0.0,0.25)',

  'eval(float(piecewise(x/2,x<0,1/4)),x,-3)',
  '-1.5',

  'eval(sin(p),x,3)',
  'sin(4)',
]);

// ---- derivative: branch by branch, conditions kept (see the note on top)
run_test([
  'p=piecewise(x^2,x<0,x,x<=2,4)',
  '',

  'd(p,x)',
  'piecewise(2*x,x<0,1,x<=2,0)',

  'd(p,x,2)',
  'piecewise(2,x<0,0,x<=2,0)',

  'd(p,y)',
  '0',

  'd(2*p+1,x)',
  '2*piecewise(2*x,x<0,1,x<=2,0)',

  'd(piecewise(sin(x),x<0,x),x)',
  'piecewise(cos(x),x<0,1)',

  'd(piecewise(a,x<0,b),x)',
  '0',

  'd(piecewise(x^2,x<0),x)',
  'piecewise(2*x,x<0)',

  'd(piecewise(-x,x<0,x),x)',
  'piecewise(-1,x<0,1)',

  'eval(d(p,x),x,-3)',
  '-6',

  // chain rule through a piecewise argument
  'd(sin(piecewise(x^2,x<0,x)),x)',
  'cos(piecewise(x^2,x<0,x))*piecewise(2*x,x<0,1)',

  'g(t)=piecewise(t^3,t<1,3*t-2)',
  '',

  'd(g(t),t)',
  'piecewise(3*t^2,t<1,3)',

  // an unknown function is still left alone
  'd(q(x),x)',
  'd(q(x),x)',
]);

// ---- definite integral: split at the break points
run_test([
  'p=piecewise(x^2,x<0,x,x<=2,4)',
  '',

  // [x^3/3] from -1 to 0
  'defint(p,x,-1,0)',
  '1/3',

  // [x^2/2] from 0 to 2
  'defint(p,x,0,2)',
  '2',

  'defint(p,x,2,3)',
  '4',

  // 1/3 + 2 + 4 across both break points
  'defint(p,x,-1,3)',
  '19/3',

  // outside of all break points
  'defint(p,x,3,5)',
  '8',

  // 9 - 1/3
  'defint(p,x,-3,-1)',
  '26/3',

  // inside one branch: (9/4 - 1/4)/2
  'defint(p,x,1/2,3/2)',
  '1',

  // reversed limits
  'defint(p,x,3,-1)',
  '-19/3',

  'defint(p,x,0,-1)',
  '-1/3',

  'defint(p,x,1,1)',
  '0',

  // a limit on a break point and one inside
  'defint(p,x,0,1)',
  '1/2',

  'float(defint(p,x,-1,3))',
  '6.333333...',

  'defint(p,x,-1.0,3.0)',
  '6.333333...',

  // 2*19/3 + 4
  'defint(2*p+1,x,-1,3)',
  '50/3',

  // abs(x) as cases, compare defint(abs(x),x,-1,2)
  'defint(piecewise(-x,x<0,x),x,-1,2)',
  '5/2',

  'defint(abs(x),x,-1,2)',
  '5/2',

  // another variable
  'defint(piecewise(t,t<1,1),t,0,3)',
  '5/2',

  // break point of a linear condition: 2*x<1 is x<1/2
  'defint(piecewise(0,2*x<1,1),x,0,1)',
  '1/2',

  'defint(piecewise(0,1<2*x,1),x,0,1)',
  '1/2',

  // irrational break point
  'defint(piecewise(0,x<sqrt(2),1),x,0,2)',
  '2-2^(1/2)',

  // nested: 1 + 2 + 3
  'defint(piecewise(piecewise(1,x<-1,2),x<0,3),x,-2,1)',
  '6',

  // x^2 on (-1,0) is 1/3, the one point x==0 has no weight
  'defint(piecewise(x^2,x<0,100,x==0,0),x,-1,1)',
  '1/3',

  // iterated integral
  'defint(piecewise(1,x<1,0)*y,x,0,2,y,0,2)',
  '2',
]);

// ---- definite integral: tariff and densities
run_test([
  // marginal tax rate: 0 up to 10, 1/5 up to 50, 2/5 above
  'r=piecewise(0,x<=10,1/5,x<=50,2/5)',
  '',

  'defint(r,x,0,5)',
  '0',

  // 20/5
  'defint(r,x,0,30)',
  '4',

  // 40/5 + 2*20/5
  'defint(r,x,0,70)',
  '16',

  // triangle density on [0,2]
  't=piecewise(x,and(0<=x,x<=1),2-x,and(1<x,x<=2),0)',
  '',

  'defint(t,x,0,2)',
  '1',

  'defint(t,x,-1,3)',
  '1',

  'defint(t,x,-inf,inf)',
  '1',

  // P(X <= 1/2) = 1/8
  'defint(t,x,-inf,1/2)',
  '1/8',

  // P(X > 3/2) = 1/8
  'defint(t,x,3/2,inf)',
  '1/8',

  // mean 1
  'defint(x*t,x,0,2)',
  '1',

  // second moment 1/4 + 11/12, so the variance is 1/6
  'defint(x^2*t,x,0,2)',
  '7/6',

  'defint((x-1)^2*t,x,-inf,inf)',
  '1/6',

  // exponential density
  'defint(piecewise(0,x<0,exp(-x)),x,-inf,inf)',
  '1',

  'defint(x*piecewise(0,x<0,exp(-x)),x,-inf,inf)',
  '1',

  // uniform density on [1,3]: mean 2
  'defint(x*piecewise(1/2,and(1<=x,x<=3),0),x,-inf,inf)',
  '2',
]);

// ---- definite integral: what stays unevaluated
run_test([
  // symbolic break point
  'defint(piecewise(1,x<a,0),x,0,2)',
  'defint(piecewise(1,x<a,0),x,0,2)',

  // break points of a condition that is not linear in x are not searched
  'defint(piecewise(1,x^2<1,0),x,-2,2)',
  'defint(piecewise(1,x^2<1,0),x,-2,2)',

  // (the function itself is fine)
  'eval(piecewise(1,x^2<1,0),x,1/2)',
  '1',

  'eval(piecewise(1,x^2<1,0),x,2)',
  '0',

  // no value on (0,1)
  'defint(piecewise(x,x<0),x,0,1)',
  'defint(piecewise(x,x<0),x,0,1)',

  // symbolic upper limit: through the continuous antiderivative
  'defint(piecewise(-x,x<0,x),x,0,t)',
  'piecewise(-1/2*t^2,t<0,1/2*t^2)',
]);

// ---- indefinite integral: the continuous antiderivative
run_test([
  // 4*x-6 joins 1/2*x^2 at x=2 (both are 2)
  'integral(piecewise(x^2,x<0,x,x<=2,4),x)',
  'piecewise(1/3*x^3,x<0,1/2*x^2,x<2,4*x-6)',

  'd(integral(piecewise(x^2,x<0,x,x<=2,4),x),x)',
  'piecewise(x^2,x<0,x,x<2,4)',

  'integral(piecewise(-x,x<0,x),x)',
  'piecewise(-1/2*x^2,x<0,1/2*x^2)',

  // the ramp
  'integral(piecewise(0,x<0,1),x)',
  'piecewise(0,x<0,x)',

  'integral(piecewise(0,x<1,1),x)',
  'piecewise(0,x<1,x-1)',

  // -cos(x) and 1/2*x^2-1 are both -1 at 0
  'integral(piecewise(sin(x),x<0,x),x)',
  'piecewise(-cos(x),x<0,1/2*x^2-1)',

  // sign function: the single point x==0 is no piece
  'integral(piecewise(-1,x<0,0,x==0,1),x)',
  'piecewise(-x,x<0,x)',

  // no Stop when the break points are unknown
  'integral(piecewise(1,x<a,0),x)',
  'integral(piecewise(1,x<a,0),x)',

  // the usual Stop for other integrands stays
  'integral(q(x),x)',
  'Stop: integral: sorry, could not find a solution',
]);

// ---- limit
run_test([
  'p=piecewise(x^2,x<0,x,x<=2,4)',
  '',

  'limit(p,x,1)',
  '1',

  'limit(p,x,-3)',
  '9',

  // continuous at 0
  'limit(p,x,0)',
  '0',

  'limit(p,x,2,left)',
  '2',

  'limit(p,x,2,right)',
  '4',

  'limit(p,x,inf)',
  '4',

  'limit(p,x,-inf)',
  'inf',

  'limit(piecewise(0,x<0,sin(x)/x),x,0,right)',
  '1',

  'limit(piecewise(0,x<0,sin(x)/x),x,0,left)',
  '0',

  // the limit is not the value: 5 at the point, x+1 around it
  'limit(piecewise(5,x==0,x+1),x,0)',
  '1',

  'eval(piecewise(5,x==0,x+1),x,0)',
  '5',

  'limit(2*p+1,x,2,right)',
  '9',

  // abs and sgn still work
  'limit(abs(x)/x,x,0,left)',
  '-1',
]);

run_test([
  'limit(piecewise(x^2,x<0,x,x<=2,4),x,2)',
  'Stop: limit: left and right limits differ — limit does not exist',
]);

// ---- simplify: inside the branches
run_test([
  'simplify(piecewise(sin(x)^2+cos(x)^2,x<0,(x^2-1)/(x-1)))',
  'piecewise(1,x<0,x+1)',

  'simplify(piecewise(x^2,x<0,x,x<=2,4))',
  'piecewise(x^2,x<0,x,x<=2,4)',

  'simplify(2*piecewise(x^2,x<0,x)+1)',
  '1+2*piecewise(x^2,x<0,x)',
]);

// ---- LaTeX
run_test([
  'printlatex(piecewise(x^2,x<0,x,x<=2,4))',
  '\\begin{cases} x^2 & {x} < {0} \\\\ x & {x} \\leq {2} \\\\ 4 & \\text{otherwise} \\end{cases}',

  // no default: no otherwise row
  'printlatex(piecewise(x^2,x<0,x,x>=2))',
  '\\begin{cases} x^2 & {x} < {0} \\\\ x & {x} \\geq {2} \\end{cases}',

  'printlatex(piecewise(x,and(0<=x,x<=1),0))',
  '\\begin{cases} x & {0} \\leq {x} \\land {x} \\leq {1} \\\\ 0 & \\text{otherwise} \\end{cases}',

  'printlatex(piecewise(1/2,x>1,0))',
  '\\begin{cases} \\frac{1}{2} & {x} > {1} \\\\ 0 & \\text{otherwise} \\end{cases}',

  // the plain print is the call
  'print(piecewise(x^2,x<0,x,x<=2,4))',
  'piecewise(x^2,x<0,x,x<=2,4)',
]);

// ---- aspiecewise: abs, sgn, min and max of two as cases
run_test([
  'aspiecewise(abs(x))',
  'piecewise(-x,x<0,x)',

  'aspiecewise(sgn(x))',
  'piecewise(-1,x<0,0,x==0,1)',

  'aspiecewise(min(x,2))',
  'piecewise(x,x<=2,2)',

  'aspiecewise(max(x,2))',
  'piecewise(x,x>=2,2)',

  'aspiecewise(x^2)',
  'x^2',

  // inside an expression: abs(x-1)+x at -2, 1 and 3
  'eval(aspiecewise(abs(x-1)+x),x,-2)',
  '1',

  'eval(aspiecewise(abs(x-1)+x),x,1)',
  '1',

  'eval(aspiecewise(abs(x-1)+x),x,3)',
  '5',

  // heaviside is 1/2+1/2*sgn(x) here
  'eval(aspiecewise(heaviside(x)),x,-1)',
  '0',

  'eval(aspiecewise(heaviside(x)),x,0)',
  '1/2',

  'eval(aspiecewise(heaviside(x)),x,2)',
  '1',

  // min(x,2) on (0,3): 2 + 2
  'defint(aspiecewise(min(x,2)),x,0,3)',
  '4',

  // abs(x-1) on (-1,2): 2 + 1/2
  'defint(aspiecewise(abs(x-1)),x,-1,2)',
  '5/2',
]);

// ---- soft builtin: a course's own piecewise wins
run_test([
  'piecewise(a,b)=a+b',
  '',

  'piecewise(1,2)',
  '3',

  'piecewise(x,x^2)',
  'x^2+x',

  'd(piecewise(x,x^2),x)',
  '2*x+1',

  'defint(piecewise(x,x^2),x,0,1)',
  '5/6',

  'printlatex(piecewise(x,x^2))',
  'x^2+x',
]);

run_test([
  // and as a variable
  'piecewise=5',
  '',

  'piecewise+1',
  '6',
]);

run_test([
  // after clearall the builtin is back
  'piecewise(1,2<3,0)',
  '1',
]);
