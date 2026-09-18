import { run_test } from '../test-harness';

// Defects found by differential testing against sympy and numeric root scans.

// 1. solve: a root of the kernel polynomial that is exactly +-1 came out of
// roots() as an undenested radical, floated to -1.0000000000000002 and was
// dropped as "outside [-1,1]". Roots are now recognised numerically, confirmed
// by exact substitution and split off; the rest is denested by simplify.
run_test([
  // T^2+(1+sqrt(3)/2)*T+sqrt(3)/2 = (T+1)*(T+sqrt(3)/2)
  // sin = -1: -pi/2; sin = -sqrt(3)/2: -pi/3 and pi+pi/3
  // (root scan: -7.85398 = -pi/2-2*pi was missing)
  'solve((sin(x)+1)*(sin(x)+sqrt(3)/2)=0,x,n)',
  '[-1/2*pi+2*n*pi,-1/3*pi+2*n*pi,4/3*pi+2*n*pi]',

  'solve((sin(x)+1)*(sin(x)+sqrt(3)/2)=0,x)',
  '[-1/2*pi,-1/3*pi,4/3*pi]',

  // other names
  'solve((sin(t)+1)*(sin(t)+sqrt(3)/2)=0,t,k)',
  '[-1/2*pi+2*k*pi,-1/3*pi+2*k*pi,4/3*pi+2*k*pi]',

  // 2*x = -pi/2, -pi/3, 4*pi/3 (+2*n*pi)
  'solve((sin(2*x)+1)*(sin(2*x)+sqrt(3)/2)=0,x,n)',
  '[-1/4*pi+n*pi,-1/6*pi+n*pi,2/3*pi+n*pi]',

  // sin = 1, sqrt(3) (none), -1/3
  'solve(expand((sin(x)-1)*(sin(x)-sqrt(3))*(sin(x)+1/3))=0,x,n)',
  '[-arcsin(1/3)+2*n*pi,1/2*pi+2*n*pi,pi+arcsin(1/3)+2*n*pi]',

  // (c-1)*(c-3/2)*(c+sqrt(3)/3): cos = 1, 3/2 (none), -sqrt(3)/3
  'solve(cos(x)^3-5*cos(x)^2/2+sqrt(3)*cos(x)^2/3-5*sqrt(3)*cos(x)/6+3*cos(x)/2+sqrt(3)/2=0,x,n)',
  '[-arccos(-1/3*3^(1/2))+2*n*pi,2*n*pi,arccos(-1/3*3^(1/2))+2*n*pi]',

  // cos = 1, -sqrt(2)/2
  'solve(expand((cos(x)-1)*(cos(x)+sqrt(2)/2))=0,x,n)',
  '[-3/4*pi+2*n*pi,2*n*pi,3/4*pi+2*n*pi]',

  // sin = 1, sqrt(2)/2
  'solve(expand((sin(x)-1)*(sin(x)-sqrt(2)/2))=0,x,n)',
  '[1/4*pi+2*n*pi,1/2*pi+2*n*pi,3/4*pi+2*n*pi]',

  // cos = -1, sqrt(3)/2, 1/2
  'solve(expand((cos(x)+1)*(cos(x)-sqrt(3)/2)*(cos(x)-1/2))=0,x,n)',
  '[-1/3*pi+2*n*pi,-1/6*pi+2*n*pi,1/6*pi+2*n*pi,1/3*pi+2*n*pi,pi+2*n*pi]',
]);

// the same cleaning for the other kernels: no family was lost here, but the
// solutions were arctan/log/... of undenested radicals
run_test([
  // tan = 1, -sqrt(3)
  'solve(expand((tan(x)-1)*(tan(x)+sqrt(3)))=0,x,n)',
  '[-1/3*pi+n*pi,1/4*pi+n*pi]',

  // tan = sqrt(3), -1/sqrt(3), 2: pi/3 and -pi/6 are half a period apart
  'solve(expand((tan(x)-sqrt(3))*(tan(x)+1/sqrt(3))*(tan(x)-2))=0,x,n)',
  '[-1/6*pi+1/2*n*pi,arctan(2)+n*pi]',

  // exp(x) = 1, sqrt(3)
  'solve(expand((exp(x)-1)*(exp(x)-sqrt(3)))=0,x)',
  '[0,1/2*log(3)]',

  // log(x) = 1, sqrt(2)
  'solve(log(x)^2-(1+sqrt(2))*log(x)+sqrt(2)=0,x)',
  '[exp(1),exp(2^(1/2))]',

  // sqrt(x) = 1, sqrt(3)
  'solve(x-(1+sqrt(3))*sqrt(x)+sqrt(3)=0,x)',
  '[1,3]',

  // abs(x) = 1, sqrt(2)
  'solve(x^2-(1+sqrt(2))*abs(x)+sqrt(2)=0,x)',
  '[-2^(1/2),-1,1,2^(1/2)]',
]);

// trig equations are solved over the reals: sin(x)=2 has no solution, so a
// kernel value that is not real gives none either
run_test([
  // -cos(2*x) = sqrt(3)
  'solve(sin(x)^2-cos(x)^2=sqrt(3),x,n)',
  'Stop: solve: no solution',

  'solve(sin(x)^2=-1,x)',
  'Stop: solve: no solution',

  'solve(cos(x)^2+1=0,x,n)',
  'Stop: solve: no solution',

  // was "divide by zero"
  'solve(tan(x)^2+1=0,x,n)',
  'Stop: solve: no solution',

  'solve(tan(x)^2+4=0,x)',
  'Stop: solve: no solution',

  // the real family stays
  'solve((sin(x)^2+1)*(sin(x)-1/2)=0,x)',
  '[1/6*pi,5/6*pi]',

  'solve((sin(x)^2+1)*(sin(x)-1/2)=0,x,n)',
  '[1/6*pi+2*n*pi,5/6*pi+2*n*pi]',
]);

// unchanged neighbours
run_test([
  'solve(sin(x)=2,x,n)',
  'Stop: solve: no solution',

  'solve(cos(x)=5,x)',
  'Stop: solve: no solution',

  // exact numbers are compared exactly, the tolerance is for radicals only
  'solve(sin(x)=1+10^(-12),x)',
  'Stop: solve: no solution',

  'solve(sin(x)=1,x,n)',
  '1/2*pi+2*n*pi',

  'solve(cos(x)=-1,x,n)',
  'pi+2*n*pi',

  'solve(sin(x)=a,x)',
  '[arcsin(a),pi-arcsin(a)]',

  'solve(tan(x)^2=a,x)',
  '[-arctan(a^(1/2)),arctan(a^(1/2))]',

  'solve(expand((sin(x)-1)*(sin(x)-1/3))=0,x,n)',
  '[arcsin(1/3)+2*n*pi,1/2*pi+2*n*pi,pi-arcsin(1/3)+2*n*pi]',

  'solve(sin(x)^2=3/4,x,n)',
  '[-1/3*pi+n*pi,1/3*pi+n*pi]',

  'solve(2*cos(x)^2-1=0,x,n)',
  '1/4*pi+1/2*n*pi',

  // sin = (-1+sqrt(5))/2, the other root is below -1
  'solve(sin(x)^2+sin(x)-1=0,x)',
  '[arcsin(-1/2+1/2*5^(1/2)),pi-arcsin(-1/2+1/2*5^(1/2))]',

  // exp keeps its complex solutions
  'solve(exp(x)=-1,x)',
  'i*pi',

  'solve(exp(2*x)+1=0,x)',
  '1/2*i*pi',
]);

// 2. gcd of polynomials in several variables missed a common factor that
// does not contain the main variable. (All expected values: sympy.gcd.)
run_test([
  // (2*y^2+4*z)*(x+1) and (2*y^2+4*z)*(x^2*y-3), was 2
  'gcd(expand((2*y^2+4*z)*(x+1)),expand((2*y^2+4*z)*(x^2*y-3)))',
  '4*z+2*y^2',

  // was 2
  'gcd(8*x*y^2+16*x*z+4*y^4-4*y^3*z+8*y^2*z-8*y*z^2,-2*x^2*y^4*z-4*x^2*y^2*z^2-2*y^3*z+8*y^3-4*y*z^2+16*y*z)',
  '4*z+2*y^2',

  // (s+t)*(u+1), (s+t)*(u-1), was 1
  'gcd(s*u+s+t*u+t,s*u-s+t*u-t)',
  's+t',

  // (y+z)^2*(x+1), (y+z)^3*(x-2), was 1
  'gcd(expand((y+z)^2*(x+1)),expand((y+z)^3*(x-2)))',
  'y^2+z^2+2*y*z',

  // (y*z-w)*(x^2+w), (y*z-w)*(x*y-1), was 1
  'gcd(-w^2-w*x^2+w*y*z+x^2*y*z,-w*x*y+w+x*y^2*z-y*z)',
  '-w+y*z',

  // 3*(y-2*z)*(x+y), 6*(y-2*z)*(x^2+1), was 3
  'gcd(3*x*y-6*x*z+3*y^2-6*y*z,6*x^2*y-12*x^2*z+6*y-12*z)',
  '3*y-6*z',

  // (y+1)*(x+z), (y+1)*(y-1)*(x-z), was 1
  'gcd(x*y+x+y*z+z,x*y^2-x-y^2*z+z)',
  'y+1',

  // (a+b)*(x-1), (a+b)*(a-b)*(x+1), was 1
  'gcd(a*x-a+b*x-b,a^2*x+a^2-b^2*x-b^2)',
  'a+b',

  // (y^2+1)*(x+2), (y^2+1)*(x^2-y), was 1
  'gcd(x*y^2+x+2*y^2+2,x^2*y^2+x^2-y^3-y)',
  'y^2+1',

  // x-y = -(y-x), was 1
  'gcd(y-x,x-y)',
  'x-y',

  // rational coefficients: (y/2+z/3)*(x+1), (y/2+z/3)*(x-1), contents 1/6
  'gcd(1/2*x*y+1/3*x*z+1/2*y+1/3*z,1/2*x*y+1/3*x*z-1/2*y-1/3*z)',
  '1/2*y+1/3*z',

  // the order of the arguments does not matter
  'gcd(expand((2*y^2+4*z)*(x^2*y-3)),expand((2*y^2+4*z)*(x+1)))',
  '4*z+2*y^2',

  // three arguments
  'gcd(expand((y+z)*(x+1)),expand((y+z)*(x-1)),expand((y+z)*(x^2+y)))',
  'y+z',
]);

// multivariate cases that were right and stay right
run_test([
  // (x*y+z)*(x+y), (x*y+z)*(x-z)
  'gcd(x^2*y+x*y^2+x*z+y*z,x^2*y-x*y*z+x*z-z^2)',
  'z+x*y',

  // (x-y)*(x+1), (y-x)*(z+1)
  'gcd(x^2-x*y+x-y,-x*z-x+y*z+y)',
  'x-y',

  // coprime
  'gcd(x*y+z,x*z+y)',
  '1',

  'gcd(x+y,x-y)',
  '1',

  // numeric content only
  'gcd(2*x*y+4*z,6*x*z+8*y)',
  '2',

  // one argument a monomial
  'gcd(x*y^2*z,x*y^2+x*y*z)',
  'x*y',

  'gcd(6*x*y,4*y^2+2*y)',
  '2*y',

  'gcd(12,x*y+y)',
  '1',

  // equal arguments
  'gcd(x*y+z,x*y+z)',
  'z+x*y',

  'gcd(x^2-y^2,x+y)',
  'x+y',

  'gcd(x^2-a^2,x-a)',
  'x-a',

  'gcd(a^2-x^2,x-a)',
  'x-a',

  'gcd(x^2*y-y,x*z+z)',
  'x+1',

  'gcd(x*y+x*z,y^2-z^2)',
  'y+z',

  'gcd(2*x+2*y,4*x+4*y)',
  '2*x+2*y',

  'gcd(a*x+a*y,b*x+b*y)',
  'x+y',

  'gcd(x+y,0)',
  'x+y',
]);

// not polynomials with rational coefficients: as before
run_test([
  // symbolic exponents
  'gcd(x^a+y,x^a+y)',
  'y+x^a',

  'gcd(x^a*y+y^2,y)',
  'y',

  'gcd(x^n+y,x^n-y)',
  '1',

  'gcd(2*x^2*y^a+2*y,4*x)',
  '2',

  // functions and roots
  'gcd(sin(x)*y+y^2,y*sin(x))',
  'y',

  'gcd(exp(x)*y+y^2,y^3)',
  'y',

  'gcd(x^(1/2)*y+y,y^2)',
  'y',

  // irrational and complex content
  'gcd(sqrt(2)*x+sqrt(2)*y,x^2-y^2)',
  'x+y',

  'gcd(i*x+i*y,x^2-y^2)',
  'x+y',

  'gcd(1.5*x+1.5*y,x+y)',
  'Stop: floating point numbers in polynomial',

  // factored arguments keep their factors
  'gcd((x+y)^2,x^2-y^2)',
  'x+y',

  'gcd(x+y,(x+y)^2)',
  'x+y',

  // univariate: Euclid as before
  'gcd(x^4-1,x^6-1)',
  'x^2-1',

  'gcd(1/2*x^2-1/2,x+1)',
  '1/2*x+1/2',

  'gcd(x^2-2,x^4-4)',
  'x^2-2',

  'gcd(30,42)',
  '6',

  'gcd(2/3,4/9)',
  '2/9',
]);
