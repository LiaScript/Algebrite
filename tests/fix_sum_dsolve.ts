import { run_test } from '../test-harness';

// Defects found by differential testing against mpmath.nsum and sympy. The
// numbers in the comments are mpmath.nsum with 30 digits; the ODE solutions
// were substituted back into the equation and the conditions.

// 1. a convergent series 1/((a*k+b)*(c*k+d)) whose partial fractions do not
// telescope was reported as divergent: each fraction goes like 1/k, the
// summand like 1/k^2. With sum c_i = 0,
//   sum_{k>=a} sum_i c_i/(k+m_i) = -sum_i c_i*digamma(a+m_i),
// and digamma at n + p/q, q = 1, 2, 3, 4, 6 is known up to Euler's constant,
// which drops out.
run_test([
  // 0.197700105960964
  'sum(1/(9*k^2-1),k,1,infinity)',
  '1/2-1/18*3^(1/2)*pi',

  // 0.613705638880109
  'sum(1/(k*(2*k+1)),k,1,infinity)',
  '2-2*log(2)',

  // 0.0406342516346092
  'sum(1/(16*k^2-1),k,2,infinity)',
  '13/30-1/8*pi',

  // 1.16852375399938
  'sum(1/((2*k+1)*(3*k+1)),k,0,infinity)',
  '-2*log(2)+3/2*log(3)+1/6*3^(1/2)*pi',

  // 1.38629436111989
  'sum(1/((k+1)*(2*k+1)),k,0,infinity)',
  '2*log(2)',

  // 0.445181884880727
  'sum(1/(k*(3*k+1)),k,1,infinity)',
  '3-3/2*log(3)-1/6*3^(1/2)*pi',

  // 1.77930095364867
  'sum(1/(k^2-1/9),k,1,infinity)',
  '9/2-1/2*3^(1/2)*pi',

  // 1.22741127776022
  'sum(1/(k*(k+1/2)),k,1,infinity)',
  '4-4*log(2)',
]);

// other denominators, limits, names, factors
run_test([
  // 0.577258872223978, a pole below the lower limit: digamma(1/2) from -3/2
  'sum(1/((2*k-3)*(k+1)),k,2,infinity)',
  '3/10+2/5*log(2)',

  // 1.73519042066605 = 1/15 + 1/2 + the sum from 0: digamma at -3/2, -5/3
  'sum(1/((2*k+1)*(3*k+1)),k,-2,infinity)',
  '17/30-2*log(2)+3/2*log(3)+1/6*3^(1/2)*pi',

  // 0.226724920529277
  'sum(1/((6*k+1)*(6*k+5)),k,0,infinity)',
  '1/24*3^(1/2)*pi',

  // 0.392699081698724
  'sum(1/((4*k+1)*(4*k+3)),k,0,infinity)',
  '1/8*pi',

  // 1.13197175367742, two groups: 1/4 and 1/2
  'sum(1/((4*k+1)*(2*k+1)),k,0,infinity)',
  '1/4*pi+1/2*log(2)',

  // 0.349762131525267
  'sum(1/(k*(4*k+1)),k,1,infinity)',
  '4-1/2*pi-3*log(2)',

  // 0.274896039482798
  'sum(1/(k*(4*k+3)),k,1,infinity)',
  '4/9+1/6*pi-log(2)',

  // 0.245088159526618
  'sum(1/(k*(6*k+1)),k,1,infinity)',
  '6-2*log(2)-3/2*log(3)-1/2*3^(1/2)*pi',

  // 0.841116916640328, three fractions 2/k - 3/(k+1/2) + 1/(k+1)
  'sum((k+2)/(k*(2*k+1)*(k+1)),k,1,infinity)',
  '5-6*log(2)',

  // 1.38629436111989
  'sum(1/(k*(2*k-1)),k,1,infinity)',
  '2*log(2)',

  // 0.132753257927728 = 2 - 2*log(2) - 1/3 - 1/10 - 1/21
  'sum(1/(k*(2*k+1)),k,4,infinity)',
  '319/210-2*log(2)',

  'sum(1/(j*(2*j+1)),j,1,inf)',
  '2-2*log(2)',

  'sum(3/(k*(2*k+1)),k,1,infinity)',
  '6-6*log(2)',

  'sum(a/(k*(2*k+1)),k,1,infinity)',
  '2*a-2*a*log(2)',

  // with other terms: a p-series, a geometric series
  'sum(1/(k*(2*k+1))+1/k^2,k,1,infinity)',
  '2-2*log(2)+1/6*pi^2',

  'sum(1/(k*(2*k+1))+1/2^k,k,1,infinity)',
  '3-2*log(2)',

  // 1.05963845043913, three groups 1/3, 1/2 and 1
  'sum(1/((3*k+1)*(2*k+1)*(k+1)),k,0,inf)',
  '-4*log(2)+9/4*log(3)+1/4*3^(1/2)*pi',

  // 0.108134376881961
  'sum(1/(k*(2*k+1)*(3*k+1)),k,1,inf)',
  '5+4*log(2)-9/2*log(3)-1/2*3^(1/2)*pi',

  // a double pole next to the simple ones: 1/k^2 - 2/k + 2/(k+1/2),
  // 0.417522789088008
  'sum(1/(k^2*(2*k+1)),k,1,inf)',
  '-4+4*log(2)+1/6*pi^2',

  // -1.03122842796812
  'sum(1/(k*(2*k+1))-1/k^2,k,1,inf)',
  '2-2*log(2)-1/6*pi^2',

  // a telescoping group and a loose one: 1 + 2 - 2*log(2)
  'sum(1/(k*(k+1))+1/(k*(2*k+1)),k,1,inf)',
  '3-2*log(2)',

  'sum(-1/(k*(2*k+1)),k,1,inf)',
  '-2+2*log(2)',

  'float(sum(1/(9*k^2-1),k,1,infinity))',
  '0.197700...',

  'float(sum(1/(k*(2*k+1)),k,1,infinity))',
  '0.613706...',
]);

// no exact digamma value: the digamma functions stay, float gives the number
run_test([
  // 0.545531070401414
  'sum(1/((5*k+1)*(5*k+2)),k,0,infinity)',
  '-1/5*digamma(1/5)+1/5*digamma(2/5)',

  'float(sum(1/((5*k+1)*(5*k+2)),k,0,infinity))',
  '0.545531...',

  // digamma(m+1/2) - digamma(m); m = 4: 0.132753257927728
  'sum(1/(k*(2*k+1)),k,m,infinity)',
  '-digamma(m)+digamma(1/2+m)',

  'float(eval(sum(1/(k*(2*k+1)),k,m,infinity),m,4))',
  '0.132753...',

  // too far from digamma(1/2) for the recurrence; 2 - 2*log(2) minus the
  // first 1999 terms is 0.000250031249999023
  'sum(1/(k*(2*k+1)),k,2000,inf)',
  '-digamma(2000)+digamma(4001/2)',

  'float(sum(1/(k*(2*k+1)),k,2000,inf))',
  '2.500312...*10^(-4)',
]);

// still divergent, judged on the whole summand
run_test([
  'sum(1/(2*k+1),k,0,infinity)',
  'Stop: sum: the series diverges',

  'sum(1/(3*k-1),k,1,infinity)',
  'Stop: sum: the series diverges',

  // degree of the denominator - degree of the numerator = 1
  'sum(k/(k^2+1),k,1,infinity)',
  'Stop: sum: the series diverges',

  'sum(1/(k*(k+1))+1/k,k,1,inf)',
  'Stop: sum: the series diverges',

  'sum((k+1)/(k*(k+2)),k,1,inf)',
  'Stop: sum: the series diverges',

  'sum((k^2+1)/(k^2+2),k,1,inf)',
  'Stop: sum: the series diverges',

  'sum(k+1/k^2,k,1,inf)',
  'Stop: sum: the series diverges',

  'sum(1/(a*k+1),k,1,inf)',
  'Stop: sum: the series diverges',

  // a divergent part and convergent ones
  'sum(1/k+1/2^k,k,1,inf)',
  'Stop: sum: the series diverges',

  'sum(2^k+1/k^2,k,1,inf)',
  'Stop: sum: the series diverges',

  'sum(1/k,k,1,inf)',
  'Stop: sum: the series diverges',

  'sum(1/(k+1),k,1,inf)',
  'Stop: sum: the series diverges',
]);

// a divergent part says nothing when another part is unknown or divergent too
run_test([
  // converges to Euler's constant 0.5772...
  'sum(1/k-log(1+1/k),k,1,inf)',
  'sum(1/k-log(1+1/k),k,1,inf)',

  // = sum 1/(k*(k^2+1)) = 0.671866...
  'sum(1/k-k/(k^2+1),k,1,inf)',
  'sum(1/k-k/(k^2+1),k,1,inf)',

  // 2^k - 2^(k+1)/2 = 0
  'sum(2^k-2^(k+1)/2+1/k^2,k,1,inf)',
  '1/6*pi^2',
]);

// neighbours that were right
run_test([
  'sum((-1)^k/(2*k+1),k,0,infinity)',
  '1/4*pi',

  'sum((-1)^k/(2*k+1),k,1,inf)',
  '-1+1/4*pi',

  'sum(1/(k*(k+1)),k,1,inf)',
  '1',

  'sum(1/((2*k-1)*(2*k+1)),k,1,inf)',
  '1/2',

  'sum(1/(k*(k+2)),k,1,inf)',
  '3/4',

  'sum(1/k^2+1/k^3,k,1,inf)',
  '1/6*pi^2+zeta(3)',

  'sum(1/(k^2+1),k,1,inf)',
  'sum(1/(k^2+1),k,1,inf)',

  'sum(1/(k*(k+a)),k,1,inf)',
  'sum(1/(k*(k+a)),k,1,inf)',

  // (k+1)/k^3 = 1/k^2 + 1/k^3
  'sum((k+1)/k^3,k,1,inf)',
  '1/6*pi^2+zeta(3)',

  'sum(1/(k^2-1),k,2,inf)',
  '3/4',

  'sum(1/((2*k+1)*(2*k+3)*(2*k+5)),k,0,inf)',
  '1/12',

  // irrational poles, a double pole off the integers: no closed form
  'sum(1/(k^2-2),k,0,inf)',
  'sum(1/(k^2-2),k,0,inf)',

  'sum(1/(k+1/2)^2,k,0,inf)',
  'sum(1/((k+1/2)^2),k,0,inf)',

  // not an integer lower limit
  'sum(1/(k*(2*k+1)),k,1/2,inf)',
  'sum(1/(k*(2*k+1)),k,1/2,inf)',

  // no closed form without digamma(n+...): stays
  'sum(1/(k*(2*k+1)),k,1,n)',
  'sum(1/(k*(2*k+1)),k,1,n)',
]);

// 2. poles of the summand inside the range
run_test([
  'sum(1/(k*(k+1)),k,-5,n)',
  'Stop: divide by zero',

  'sum(1/(k*(k+1)),k,0,n)',
  'Stop: divide by zero',

  'sum(1/(k*(k+1)),k,-1,n)',
  'Stop: divide by zero',

  'sum(1/(k*(k+1)),k,-5,inf)',
  'Stop: divide by zero',

  'sum(1/(k*(k+1)),k,-5,3)',
  'Stop: divide by zero',

  'sum(1/(k-3),k,1,5)',
  'Stop: divide by zero',

  'sum(1/(k-3),k,1,n)',
  'Stop: divide by zero',

  'sum(1/((k-2)*(k-3)),k,0,n)',
  'Stop: divide by zero',

  'sum(1/((j-2)*(j-3)),j,3,n)',
  'Stop: divide by zero',

  'sum(1/((k+5)*(k+6)),k,-5,n)',
  'Stop: divide by zero',

  'sum(1/k^2,k,0,inf)',
  'Stop: divide by zero',

  'sum(1/k^2,k,-3,inf)',
  'Stop: divide by zero',

  'sum(1/(k*(2*k+1)),k,-3,inf)',
  'Stop: divide by zero',

  'sum(1/(k*(2*k+1)),k,0,inf)',
  'Stop: divide by zero',

  // k^2-1 and k^2+3*k+2 are factored
  'sum(1/(k^2-1),k,1,inf)',
  'Stop: divide by zero',

  'sum(1/(k^2+3*k+2),k,-2,n)',
  'Stop: divide by zero',

  'sum(x^k/(k-2),k,0,inf)',
  'Stop: divide by zero',

  // geometric and Gosper summands
  'sum(2^k/(k-3),k,0,n)',
  'Stop: divide by zero',

  'sum(2^k*(k-1)/(k*(k+1)),k,0,n)',
  'Stop: divide by zero',

  'sum(k+1/(k-2),k,0,n)',
  'Stop: divide by zero',

  'sum((-1)^k/k,k,0,inf)',
  'Stop: divide by zero',
]);

// no pole in the range: the closed forms stay
run_test([
  // 1/(k-3) - 1/(k-2) from 4: n = 4: 1/2, n = 6: 3/4
  'sum(1/((k-2)*(k-3)),k,4,n)',
  '1-1/(-2+n)',

  // the poles -5, -6 are below -4
  'sum(1/((k+5)*(k+6)),k,-4,n)',
  '1-1/(6+n)',

  'sum(1/((k+5)*(k+6)),k,-4,inf)',
  '1',

  // poles at 1/2 and -1/2 only: n = -3: 1/35, n = 0: -1/7-1 = -8/7 -> /2
  'eval(sum(1/((2*k-1)*(2*k+1)),k,-3,n),n,-3)',
  '1/35',

  'eval(sum(1/((2*k-1)*(2*k+1)),k,-3,n),n,0)',
  '-4/7',

  'sum(1/(k*(k+1)),k,1,n)',
  '1-1/(1+n)',

  'sum(1/(k^2+3*k+2),k,0,n)',
  '1-1/(2+n)',

  // a symbolic pole or lower limit is not decided
  'simplify(sum(1/((k+m)*(k+m+1)),k,1,n)-(1/(m+1)-1/(n+m+1)))',
  '0',

  'simplify(sum(1/(k*(k+1)),k,m,n)-(1/m-1/(n+1)))',
  '0',

  // 2^(k+1)/(k+1) - 2^k/k from 1: n = 1: 0, n = 2: 2/3
  'eval(sum(2^k*(k-1)/(k*(k+1)),k,1,n),n,2)',
  '2/3',

  'sum(1/k^2,k,1,inf)',
  '1/6*pi^2',

  'sum((-1)^k/k,k,1,inf)',
  '-log(2)',

  // factorials have no poles to look for
  'sum(1/k!,k,0,inf)-exp(1)',
  '0',

  'sum(k*k!,k,0,n)',
  '-1+(1+n)!',
]);

// 3. the constants of integration avoid the names used in the equation and
// in the conditions
run_test([
  // y' = -C1*C2*exp(-C1*x) = -C1*y
  'dsolve(d(y(x),x)+C1*y(x)=0,y(x))',
  'C2*exp(-C1*x)',

  'dsolve(d(y(x),x)=x*C1,y(x))',
  '1/2*C1*x^2+C2',

  'dsolve(d(u(t),t)+C1*u(t)=0,u(t))',
  'C2*exp(-C1*t)',

  // C2 is taken, C1 is free
  'dsolve(d(y(x),x)=C2*y(x),y(x))',
  'C1*exp(C2*x)',

  // C1 and C2 taken
  'dsolve(d(y(x),x)=C1*y(x)+C2,y(x))',
  'C3*exp(C1*x)-C2/C1',

  // second order: C1 and C3
  'dsolve(d(y(x),x,2)+y(x)=C2,y(x))',
  'C2+C1*cos(x)+C3*sin(x)',

  'dsolve(d(y(x),x,2)=C1*x,y(x))',
  '1/6*C1*x^3+C3*x+C2',

  // the name in a condition: y(0) = C2, the other constant is C1
  'dsolve(d(y(x),x,2)+y(x)=0,y(x),y(0)=C2)',
  'C1*sin(x)+C2*cos(x)',

  'dsolve(d(y(x),x)=y(x),y(x),y(0)=C1)',
  'C1*exp(x)',

  'dsolve(d(y(x),x,2)+y(x)=0,y(x),y(0)=C1)',
  'C1*cos(x)+C2*sin(x)',

  // y = C1*x^2/2 + C2 + C3*x, y(0) = 0: C2 = 0, and C3 becomes C2
  'dsolve(d(y(x),x,2)=C1,y(x),y(0)=0)',
  'x*(1/2*C1*x+C2)',

  // a value bound to C1 does not free the name
  'C1=5',
  '',

  'dsolve(d(y(x),x)+C1*y(x)=0,y(x))',
  'C2*exp(-5*x)',

  'C1=quote(C1)',
  '',

  // systems: C2 = x(0), C3 = y(0); x' = C1*C3*cos - C2*abs(C1)*sin = C1*y
  'dsolve([d(x(t),t)=C1*y(t),d(y(t),t)=-C1*x(t)],[x(t),y(t)])',
  '[C1*C3*sin(t*abs(C1))/abs(C1)+C2*cos(t*abs(C1)),-C1*C2*sin(t*abs(C1))/abs(C1)+C3*cos(t*abs(C1))]',

  // C1 = x(0), C3 = y(0)
  'dsolve([d(x(t),t)=y(t)+C2,d(y(t),t)=-x(t)],[x(t),y(t)])',
  '[C1*cos(t)+C2*sin(t)+C3*sin(t),-C2-C1*sin(t)+C2*cos(t)+C3*cos(t)]',

  // separable, Bernoulli and exact equations
  'dsolve(d(y(x),x)=C1*y(x)^2,y(x))',
  '-1/(C1*(x+C2))',

  // no clash: as before
  'dsolve(d(y(x),x)+a*y(x)=0,y(x))',
  'C1*exp(-a*x)',

  'dsolve(d(y(x),x,2)+y(x)=0,y(x))',
  'C1*cos(x)+C2*sin(x)',

  'dsolve(d(y(x),x,2)+y(x)=0,y(x),y(0)=1)',
  'C1*sin(x)+cos(x)',

  'dsolve(d(y(x),x,2)+y(x)=0,y(x),d(y(x),x)(0)=1)',
  'C1*cos(x)+sin(x)',
]);

// 4. a condition on a constant solution y = y0, h(y0) = 0 of y' = g(x)*h(y)
run_test([
  'dsolve(d(y(x),x)=y(x)^2,y(x),y(0)=0)',
  '0',

  'dsolve(d(y(x),x)=y(x)*(1-y(x)),y(x),y(0)=1)',
  '1',

  'dsolve(d(y(x),x)=y(x)*(1-y(x)),y(x),y(0)=0)',
  '0',

  'dsolve(d(y(x),x)=x*(y(x)^2-4),y(x),y(1)=2)',
  '2',

  'dsolve(d(y(x),x)=x*(y(x)^2-4),y(x),y(1)=-2)',
  '-2',

  'dsolve(d(y(x),x)=y(x)^2-a^2,y(x),y(0)=a)',
  'a',

  'dsolve(d(u(t),t)=cos(t)*u(t)^3,u(t),u(5)=0)',
  '0',

  // sin(pi) = 0
  'dsolve(d(y(x),x)=sin(y(x)),y(x),y(0)=pi)',
  'pi',

  'dsolve(d(y(x),x)=(y(x)-1)^2,y(x),y(0)=1)',
  '1',

  'dsolve(d(y(x),x)=y(x)*(y(x)-1)*(y(x)-2),y(x),y(0)=2)',
  '2',

  'dsolve(d(y(x),x)+y(x)=y(x)^2,y(x),y(0)=1)',
  '1',

  'dsolve(d(y(x),x)+y(x)=y(x)^2,y(x),y(0)=0)',
  '0',

  // Bernoulli y' = x*y + y^2: y = 0
  'dsolve(d(y(x),x)=x*y(x)+y(x)^2,y(x),y(0)=0)',
  '0',

  // homogeneous, x*v' = tan(v): v = 0 and v = pi, y = v*x
  'dsolve(d(y(x),x)=y(x)/x+tan(y(x)/x),y(x),y(1)=0)',
  '0',

  'dsolve(d(y(x),x)=y(x)/x+tan(y(x)/x),y(x),y(1)=pi)',
  'pi*x',

  // Bernoulli with k = 1/2 < 1: v = y^(1/2) has a value at 0, as before;
  // y' = x*y + sqrt(y) holds with sqrt(y) = sqrt(pi)/2*exp(x^2/4)*erf(x/2)
  'dsolve(d(y(x),x)=x*y(x)+sqrt(y(x)),y(x),y(0)=0)',
  '1/4*pi*exp(1/2*x^2)*erf(1/2*x)^2',

  // h has no zero at y0: as before
  'dsolve(d(y(x),x)=1/y(x),y(x),y(0)=0)',
  '[-(2*x)^(1/2),(2*x)^(1/2)]',

  'dsolve(d(y(x),x)=y(x)^2,y(x),d(y(x),x)(0)=0)',
  'Stop: dsolve: a first-order equation takes one initial condition y(x0)=y0',

  // other conditions and the general solution as before:
  // y = 1/(1-x): y' = 1/(1-x)^2 = y^2, y(0) = 1
  'dsolve(d(y(x),x)=y(x)^2,y(x),y(0)=1)',
  '1/(-x+1)',

  'dsolve(d(y(x),x)=y(x)^2,y(x))',
  '-1/(x+C1)',

  'dsolve(d(y(x),x)=y(x)*(1-y(x)),y(x))',
  'C1*exp(x)/(-1+C1*exp(x))',

  // y = exp(x)/(1+exp(x)): y(0) = 1/2, y' = y*(1-y)
  'dsolve(d(y(x),x)=y(x)*(1-y(x)),y(x),y(0)=1/2)',
  'exp(x)/(1+exp(x))',
]);

// 5. separable with arctan on both sides: arctan(y) = arctan(x) + C
run_test([
  // y' = (1+tan(u)^2)/(1+x^2) for u = arctan(x)+C1
  'dsolve((1+x^2)*d(y(x),x)=1+y(x)^2,y(x))',
  'tan(C1+arctan(x))',

  'dsolve(d(y(x),x)=(1+y(x)^2)/(1+x^2),y(x))',
  'tan(C1+arctan(x))',

  // y(0) = 1: tan(arctan(x)+pi/4)
  'dsolve((1+x^2)*d(y(x),x)=1+y(x)^2,y(x),y(0)=1)',
  'tan(1/4*pi+arctan(x))',

  // arctan(y) - arctan(x) = 0
  'dsolve((1+x^2)*d(y(x),x)=1+y(x)^2,y(x),y(1)=1)',
  'x',

  // y' = 2/cos(u)^2*(1/2)/(1+x^2/4) = (4+y^2)/(4+x^2)
  'dsolve((4+x^2)*d(y(x),x)=4+y(x)^2,y(x))',
  '2*tan(C1+arctan(1/2*x))',

  'dsolve((1+x^2)*d(y(x),x)=x*(1+y(x)^2),y(x))',
  'tan(C1+1/2*log(x^2+1))',

  'dsolve(x*d(y(x),x)=1+y(x)^2,y(x))',
  'tan(C1+log(x))',

  'dsolve((1+t^2)*d(u(t),t)=1+u(t)^2,u(t))',
  'tan(C1+arctan(t))',

  'dsolve(d(y(x),x)=1+y(x)^2,y(x))',
  'tan(x+C1)',

  'dsolve(d(y(x),x)=x*(1+y(x)^2),y(x))',
  'tan(1/2*x^2+C1)',
]);
