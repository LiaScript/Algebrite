import { run_test } from '../test-harness';

// dsolve beyond tests/dsolve.ts: any number of initial or boundary
// conditions, Euler-Cauchy, exact and homogeneous equations, y'' = f(x,y').
// Every solution was substituted back into its equation (sympy, and
// numerically at three points) and every condition was checked; the pairs
// "simplify(residual) => 0" repeat that check inside Algebrite.

// conditions as further arguments, as a list, or both
run_test([
  "dsolve(d(y(x),x,2)+y(x),y(x),y(0)=1,y'(0)=0)",
  'cos(x)',

  "dsolve(d(y(x),x,2)+y(x),y(x),[y(0)=1,y'(0)=0])",
  'cos(x)',

  "dsolve(d(y(x),x,2)+y(x),y(x),[y(0)=1],y'(0)=0)",
  'cos(x)',

  // the derivative written out
  'dsolve(d(y(x),x,2)+y(x),y(x),y(0)=1,d(y(x),x)(0)=0)',
  'cos(x)',

  'dsolve(d(y(x),x,2)+y(x),y(x),y(0)=0,d(y(x),x)(0)=3)',
  '3*sin(x)',

  'dsolve(d(y(x),x)=y(x),y(x),y(0)=2)',
  '2*exp(x)',

  // symbolic values
  "dsolve(d(y(x),x,2)+y(x),y(x),y(0)=a,y'(0)=b)",
  'a*cos(x)+b*sin(x)',

  // a symbolic point
  'dsolve(d(y(x),x)=y(x),y(x),y(a)=1)',
  'exp(x-a)',

  "dsolve(d(y(x),x,2)=0,y(x),y(0)=0,y'(a)=1)",
  'x',

  // other names
  "dsolve(d(u(t),t,2)+4*u(t),u(t),u(0)=0,u'(0)=2)",
  'sin(2*t)',

  // with a forcing term: x - sin(x)
  "s=dsolve(d(y(x),x,2)+y(x)=x,y(x),y(0)=0,y'(0)=0)",
  '',

  's',
  'x-sin(x)',

  'simplify(d(s,x,2)+s-x)',
  '0',

  // third order, y''(0)
  "s3=dsolve(d(y(x),x,3)-d(y(x),x)=0,y(x),y(0)=0,y'(0)=1,y''(0)=0)",
  '',

  // sinh(x)
  's3',
  '-1/2*exp(-x)+1/2*exp(x)',

  "dsolve(d(y(x),x,3)=0,y(x),y(0)=1,y'(0)=2,y''(0)=6)",
  '1+2*x+3*x^2',

  'dsolve(d(y(x),x,3)=0,y(x),y(0)=1,d(y(x),x,2)(0)=6)',
  '1+C1*x+3*x^2',
]);

// boundary conditions at two points
run_test([
  'dsolve(d(y(x),x,2)+y(x),y(x),y(0)=0,y(pi/2)=1)',
  'sin(x)',

  'dsolve(d(y(x),x,2)=0,y(x),y(0)=1,y(1)=3)',
  '1+2*x',

  // exp(x)/(e - 1/e) - exp(-x)/(e - 1/e)
  's=dsolve(d(y(x),x,2)-y(x),y(x),y(0)=0,y(1)=1)',
  '',

  'simplify(d(s,x,2)-s)',
  '0',

  'simplify(subst(0,x,s))',
  '0',

  'simplify(subst(1,x,s))',
  '1',

  "dsolve(d(y(x),x,2)+y(x),y(x),y'(0)=1,y(pi)=2)",
  '-2*cos(x)+sin(x)',
]);

// fewer conditions than the order: the other constants stay, from C1 on
run_test([
  'dsolve(d(y(x),x,2)+y(x),y(x),y(0)=1)',
  'C1*sin(x)+cos(x)',

  'dsolve(d(y(x),x,2)+y(x),y(x),[y(0)=1])',
  'C1*sin(x)+cos(x)',

  "dsolve(d(y(x),x,2)+y(x),y(x),y'(0)=2)",
  'C1*cos(x)+2*sin(x)',

  // C1 cos(x) + C2 sin(x) + C3 x cos(x) + C4 x sin(x) with y(0)=0, y'(0)=0
  "s=dsolve(d(y(x),x,4)+2*d(y(x),x,2)+y(x)=0,y(x),y(0)=0,y'(0)=0)",
  '',

  'simplify(d(s,x,4)+2*d(s,x,2)+s)',
  '0',

  'subst(0,x,s)',
  '0',

  'subst(0,x,d(s,x))',
  '0',

  // two constants are left, C1 and C2
  'simplify(d(s,C1))==0',
  '0',

  'simplify(d(s,C2))==0',
  '0',

  'd(s,C3)',
  '0',

  // a condition that says nothing new
  'dsolve(d(y(x),x,2)+y(x),y(x),y(0)=0,y(pi)=0)',
  'C1*sin(x)',

  "dsolve(d(y(x),x,2)+y(x),y(x),y(0)=1,y'(0)=0,y(pi)=-1)",
  'cos(x)',

  'dsolve(d(y(x),x)=y(x),y(x),y(0)=1,y(1)=exp(1))',
  'exp(x)',
]);

// conditions nothing satisfies, conditions dsolve can't read
run_test([
  'dsolve(d(y(x),x,2)+y(x),y(x),y(0)=0,y(pi)=1)',
  'Stop: dsolve: no solution satisfies the conditions',

  "dsolve(d(y(x),x,2)+y(x),y(x),y(0)=1,y'(0)=0,y(pi)=1)",
  'Stop: dsolve: no solution satisfies the conditions',

  'dsolve(d(y(x),x)=y(x),y(x),y(0)=1,y(1)=1)',
  'Stop: dsolve: no solution satisfies the conditions',

  'dsolve(d(y(x),x)=x/y(x),y(x),y(0)=1,y(1)=1)',
  'Stop: dsolve: a first-order equation takes one initial condition y(x0)=y0',

  'dsolve(d(y(x),x,2)+y(x),y(x),z(0)=1)',
  "Stop: dsolve: conditions must look like y(0)=1, y'(0)=1 or d(y(x),x,2)(0)=1",

  'dsolve(d(y(x),x,2)+y(x),y(x),y(0))',
  "Stop: dsolve: conditions must look like y(0)=1, y'(0)=1 or d(y(x),x,2)(0)=1",

  'dsolve(d(y(x),x,2)+y(x),y(x),y(0)+y(1)=1)',
  "Stop: dsolve: conditions must look like y(0)=1, y'(0)=1 or d(y(x),x,2)(0)=1",

  'dsolve(d(y(x),x,2)+y(x))',
  'Stop: dsolve: 2nd argument must be a function call like y(x)',
]);

// Euler-Cauchy a x^2 y'' + b x y' + c y = 0: x^r for the roots r of
// a r (r-1) + b r + c. The solutions are written with log(x), real for
// x > 0; they solve the equation for x < 0 too, there with the complex
// log(x) = log(-x) + i pi. The residual checks below hold for every x.
run_test([
  // distinct real roots
  'dsolve(x^2*d(y(x),x,2)+x*d(y(x),x)-y(x),y(x))',
  'C1/x+C2*x',

  'dsolve(x^2*d(y(x),x,2)-2*y(x)=0,y(x))',
  'C1/x+C2*x^2',

  // double root
  's=dsolve(x^2*d(y(x),x,2)-x*d(y(x),x)+y(x),y(x))',
  '',

  's',
  'C1*x+C2*x*log(x)',

  'simplify(x^2*d(s,x,2)-x*d(s,x)+s)',
  '0',

  // complex roots -1 +- 2i
  's=dsolve(x^2*d(y(x),x,2)+3*x*d(y(x),x)+5*y(x),y(x))',
  '',

  's',
  'C1*cos(2*log(x))/x+C2*sin(2*log(x))/x',

  'simplify(x^2*d(s,x,2)+3*x*d(s,x)+5*s)',
  '0',

  'dsolve(x^2*d(y(x),x,2)+x*d(y(x),x)+y(x),y(x))',
  'C1*cos(log(x))+C2*sin(log(x))',

  // irrational roots +- 2^(1/2)
  's=dsolve(x^2*d(y(x),x,2)+x*d(y(x),x)-2*y(x),y(x))',
  '',

  'simplify(x^2*d(s,x,2)+x*d(s,x)-2*s)',
  '0',

  's',
  'C1*x^(-2^(1/2))+C2*x^(2^(1/2))',

  // divided by x^2, multiplied by a constant
  'dsolve(d(y(x),x,2)+d(y(x),x)/x-y(x)/x^2=0,y(x))',
  'C1/x+C2*x',

  'dsolve(3*x^2*d(y(x),x,2)=6*y(x),y(x))',
  'C1/x+C2*x^2',

  // x y'' + y' = 0
  'dsolve(x*d(y(x),x,2)+d(y(x),x)=0,y(x))',
  'C1+C2*log(x)',

  // other names
  'dsolve(t^2*d(u(t),t,2)+t*d(u(t),t)-4*u(t),u(t))',
  'C1/t^2+C2*t^2',

  // third order, (r-1)^3
  's=dsolve(x^3*d(y(x),x,3)+x*d(y(x),x)-y(x),y(x))',
  '',

  's',
  'C1*x+C2*x*log(x)+C3*x*log(x)^2',

  'simplify(x^3*d(s,x,3)+x*d(s,x)-s)',
  '0',
]);

// Euler-Cauchy with a right side, conditions, parameters
run_test([
  's=dsolve(x^2*d(y(x),x,2)-2*y(x)=x^3,y(x))',
  '',

  's',
  'C1/x+C2*x^2+1/4*x^3',

  'simplify(x^2*d(s,x,2)-2*s-x^3)',
  '0',

  // the right side solves the homogeneous equation
  's=dsolve(x^2*d(y(x),x,2)-2*y(x)=x^2,y(x))',
  '',

  's',
  'C1/x+C2*x^2+1/3*x^2*log(x)',

  'simplify(x^2*d(s,x,2)-2*s-x^2)',
  '0',

  's=dsolve(x^2*d(y(x),x,2)+x*d(y(x),x)-y(x)=log(x),y(x))',
  '',

  's',
  'C1/x+C2*x-log(x)',

  'simplify(x^2*d(s,x,2)+x*d(s,x)-s-log(x))',
  '0',

  // y(1) = 2, y'(1) = 0
  "dsolve(x^2*d(y(x),x,2)+x*d(y(x),x)-y(x),y(x),y(1)=2,y'(1)=0)",
  '1/x+x',

  // boundary values
  'dsolve(x^2*d(y(x),x,2)-2*y(x)=0,y(x),y(1)=1,y(2)=4)',
  'x^2',

  'dsolve(x^2*d(y(x),x,2)+x*d(y(x),x)+y(x),y(x),y(1)=1)',
  'C1*sin(log(x))+cos(log(x))',

  'assume(a,positive)',
  '',

  'dsolve(x^2*d(y(x),x,2)+x*d(y(x),x)-a^2*y(x),y(x))',
  'C1*x^a+C2*x^(-a)',

  'dsolve(x^2*d(y(x),x,2)+x*d(y(x),x)+a^2*y(x),y(x))',
  'C1*cos(a*log(x))+C2*sin(a*log(x))',
]);

// float coefficients: roots +- 0.5
run_test([
  's=dsolve(x^2*d(y(x),x,2)+x*d(y(x),x)-0.25*y(x),y(x))',
  '',

  'abs(float(subst(1,C2,subst(1,C1,subst(2,x,x^2*d(s,x,2)+x*d(s,x)-0.25*s)))))<10^(-12)',
  '1',

  // 2^0.5 + 2^(-0.5)
  'float(subst(1,C2,subst(1,C1,subst(2,x,s))))',
  '2.12132...',
]);

// exact equations M + N y' = 0 with dM/dy = dN/dx: Psi(x,y) = C1 with
// dPsi/dx = M, dPsi/dy = N
run_test([
  // x^2 y + x + y^2 = C1
  's=dsolve(2*x*y(x)+1+(x^2+2*y(x))*d(y(x),x)=0,y(x))',
  '',

  'simplify(2*x*s[1]+1+(x^2+2*s[1])*d(s[1],x))',
  '0',

  'simplify(2*x*s[2]+1+(x^2+2*s[2])*d(s[2],x))',
  '0',

  'simplify(x^2*s[1]+x+s[1]^2)',
  'C1',

  'simplify(x^2*s[2]+x+s[2]^2)',
  'C1',

  // solved for y'
  's=dsolve(d(y(x),x)=-(2*x*y(x)+1)/(x^2+2*y(x)),y(x))',
  '',

  'simplify(x^2*s[1]+x+s[1]^2)',
  'C1',

  // the initial value picks the branch and C1 = 1
  's=dsolve(2*x*y(x)+1+(x^2+2*y(x))*d(y(x),x)=0,y(x),y(0)=1)',
  '',

  's',
  '-1/2*x^2+1/2*(x^4-4*x+4)^(1/2)',

  'subst(0,x,s)',
  '1',

  'simplify(2*x*s+1+(x^2+2*s)*d(s,x))',
  '0',

  // y^2 + y sin(x) = C1
  's=dsolve(y(x)*cos(x)+(2*y(x)+sin(x))*d(y(x),x)=0,y(x))',
  '',

  'simplify(s[1]^2+s[1]*sin(x))',
  'C1',

  'simplify(s[2]^2+s[2]*sin(x))',
  'C1',

  // other names: t^2 u + t + u^2 = C1
  's=dsolve(2*t*u(t)+1+(t^2+2*u(t))*d(u(t),t)=0,u(t))',
  '',

  'simplify(t^2*s[2]+t+s[2]^2)',
  'C1',

  // no formula for y: the relation, as for separable equations
  'dsolve(y(x)*cos(x)+2*x*exp(y(x))+(sin(x)+x^2*exp(y(x))-1)*d(y(x),x)=0,y(x))',
  'Stop: dsolve: can only give the implicit solution x^2*exp(y(x))+y(x)*sin(x)-y(x) = C1',
]);

// homogeneous equations y' = F(y/x): y = v x gives the separable
// x v' = F(v) - v
run_test([
  // x v' = v^2 + 1
  's=dsolve(d(y(x),x)=(y(x)^2+x*y(x)+x^2)/x^2,y(x))',
  '',

  's',
  'x*tan(C1+log(x))',

  'simplify(d(s,x)-(s^2+x*s+x^2)/x^2)',
  '0',

  's=dsolve(d(y(x),x)=(y(x)^2+x*y(x)+x^2)/x^2,y(x),y(1)=0)',
  '',

  's',
  'x*tan(log(x))',

  // y(1) = 1: arctan(1) = pi/4
  'dsolve(x^2*d(y(x),x)=y(x)^2+x*y(x)+x^2,y(x),y(1)=1)',
  'x*tan(1/4*pi+log(x))',

  'dsolve(d(u(t),t)=(u(t)^2+t*u(t)+t^2)/t^2,u(t))',
  't*tan(C1+log(t))',

  // x v' = exp(v): -exp(-v) = log(x) + C1
  'dsolve(d(y(x),x)=exp(y(x)/x)+y(x)/x,y(x))',
  'Stop: dsolve: can only give the implicit solution -exp(-y(x)/x)-log(x) = C1',

  // x v' = -(v^2+1)/(v+1): (x^2 + y^2) exp(2 arctan(y/x)) = C1
  'dsolve(d(y(x),x)=(y(x)-x)/(y(x)+x),y(x))',
  'Stop: dsolve: can only give the implicit solution (x^2+y(x)^2)*exp(2*arctan(y(x)/x)) = C1',
]);

// y'' = f(x, y'): first order in p = y', then y = integral(p) + C2
run_test([
  's=dsolve((1+x^2)*d(y(x),x,2)+2*x*d(y(x),x)=0,y(x))',
  '',

  's',
  'C2+C1*arctan(x)',

  'simplify((1+x^2)*d(s,x,2)+2*x*d(s,x))',
  '0',

  "dsolve((1+x^2)*d(y(x),x,2)+2*x*d(y(x),x)=0,y(x),y(0)=1,y'(0)=2)",
  '1+2*arctan(x)',

  // p' = p^2
  's=dsolve(d(y(x),x,2)=d(y(x),x)^2,y(x))',
  '',

  'simplify(d(s,x,2)-d(s,x)^2)',
  '0',

  // both constants are there
  'simplify(d(s,C1))==0',
  '0',

  'd(s,C2)',
  '1',

  // p' = 1 + p^2: p = tan(x + C1)
  's=dsolve(d(y(x),x,2)=1+d(y(x),x)^2,y(x))',
  '',

  'simplify(d(s,x,2)-1-d(s,x)^2)',
  '0',

  // y = -log(x+1)
  "s=dsolve(d(y(x),x,2)=d(y(x),x)^2,y(x),y(0)=0,y'(0)=-1)",
  '',

  'subst(0,x,s)',
  '0',

  'subst(0,x,d(s,x))',
  '-1',

  'simplify(d(s,x,2)-d(s,x)^2)',
  '0',

  'd(s,C1)',
  '0',
]);

// what stays unsupported says so
run_test([
  // Riccati
  'dsolve(d(y(x),x)-x-y(x)^2,y(x))',
  "Stop: dsolve: unsupported equation. Supported: first order separable, linear, Bernoulli, homogeneous y'=F(y/x), exact; linear with constant coefficients; Euler-Cauchy; y''=f(x,y')",

  // x missing
  'dsolve(d(y(x),x,2)=y(x)*d(y(x),x),y(x))',
  "Stop: dsolve: unsupported equation. Supported: first order separable, linear, Bernoulli, homogeneous y'=F(y/x), exact; linear with constant coefficients; Euler-Cauchy; y''=f(x,y')",

  // Bessel-like, not Euler-Cauchy
  'dsolve(x*d(y(x),x,2)+y(x)=0,y(x))',
  "Stop: dsolve: unsupported equation. Supported: first order separable, linear, Bernoulli, homogeneous y'=F(y/x), exact; linear with constant coefficients; Euler-Cauchy; y''=f(x,y')",

  'dsolve(x^2*d(y(x),x,2)+x^2*d(y(x),x)+y(x)=0,y(x))',
  "Stop: dsolve: unsupported equation. Supported: first order separable, linear, Bernoulli, homogeneous y'=F(y/x), exact; linear with constant coefficients; Euler-Cauchy; y''=f(x,y')",

  // not exact, not homogeneous
  'dsolve(y(x)+(2*x+y(x)^2*exp(y(x)))*d(y(x),x)=0,y(x))',
  "Stop: dsolve: unsupported equation. Supported: first order separable, linear, Bernoulli, homogeneous y'=F(y/x), exact; linear with constant coefficients; Euler-Cauchy; y''=f(x,y')",
]);

// the classes of tests/dsolve.ts keep their results
run_test([
  // linear, not taken as homogeneous
  'dsolve(d(y(x),x)-(x+y(x))/x,y(x))',
  'C1*x+x*log(x)',

  // Bernoulli, not taken as homogeneous
  'dsolve(d(y(x),x)=(x^2+y(x)^2)/(x*y(x)),y(x))',
  '[-(C1*x^2+2*x^2*log(x))^(1/2),(C1*x^2+2*x^2*log(x))^(1/2)]',

  // separable and exact
  'dsolve(x+y(x)*d(y(x),x)=0,y(x))',
  '[-(-x^2+2*C1)^(1/2),(-x^2+2*C1)^(1/2)]',

  'dsolve(x*d(y(x),x)=2*y(x),y(x))',
  'C1*x^2',

  'dsolve(d(y(x),x,2)+3*d(y(x),x)+2*y(x)=0,y(x))',
  'C1*exp(-2*x)+C2*exp(-x)',

  'dsolve(d(y(x),x,2)=0,y(x))',
  'C2*x+C1',

  'dsolve(d(y(x),x)=exp(y(x))*x,y(x))',
  'Stop: dsolve: can only give the implicit solution -1/2*x^2-exp(-y(x)) = C1',

  'dsolve(d(y(x),x)=0.5*y(x),y(x))',
  '1.0*C1*exp(0.5*x)',

  // y is still undefined
  'y(2)',
  'y(2)',
]);
