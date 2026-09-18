import { run_test } from '../test-harness';

// Names and conventions users bring from other CAS.
run_test([
  // infinity is inf
  'infinity',
  'inf',

  '-infinity',
  '-inf',

  '1/infinity',
  '0',

  'infinity-infinity',
  'Stop: indeterminate form: inf-inf',

  'limit(1/x,x,infinity)',
  '0',

  'limit(exp(-x)*x^3,x,infinity)',
  '0',

  'limit(exp(x),x,-infinity)',
  '0',

  'defint(exp(-x^2),x,-infinity,infinity)',
  'pi^(1/2)',

  'defint(1/x^2,x,1,infinity)',
  '1',

  'sum(1/2^k,k,0,infinity)',
  '2',

  // gamma(x) is Gamma(x), while gamma stays free as a variable name
  'gamma(5)',
  '24',

  'Gamma(5)',
  '24',

  'gamma(1/2)',
  'pi^(1/2)',

  'gamma(x+1)/gamma(x)',
  'x',

  'gamma(x)',
  'Gamma(x)',

  'float(gamma(3.7))',
  '4.170652...',

  'gamma=3',
  '',

  'gamma+1',
  '4',

  // the Lorentz factor at v = 3/5: 1/sqrt(16/25) = 5/4
  'gamma=1/sqrt(1-v^2)',
  '',

  'subst(3/5,v,gamma)',
  '5/4',

  'clear(gamma)',
  '',

  'gamma(4)',
  '6',

  // limit from one side by name
  'limit(1/x,x,0,right)',
  'inf',

  'limit(1/x,x,0,left)',
  '-inf',

  'limit(abs(x)/x,x,0,left)',
  '-1',

  'limit(abs(x)/x,x,0,right)',
  '1',

  'limit(tan(x),x,pi/2,left)',
  'inf',

  'limit(1/x,x,0,1)',
  'inf',

  'limit(1/x,x,0,-1)',
  '-inf',

  'limit(1/x,x,0,up)',
  'Stop: limit: 4th argument must be left, right or a positive or negative number',

  // mod takes the sign of the divisor, as in Maxima, Mathematica and SymPy:
  // -7 = -3*3 + 2, 7 = -3*(-3) - 2, -7 = 2*(-3) - 1
  'mod(-7,3)',
  '2',

  'mod(7,-3)',
  '-2',

  'mod(-7,-3)',
  '-1',

  'mod(7,3)',
  '1',

  'mod(-6,3)',
  '0',

  'mod(-2.0,3.0)',
  '1',

  // 1024 = 146*7 + 2
  'mod(2^10,7)',
  '2',

  'mod(-1,n)',
  'mod(-1,n)',

  // the functions added later are soft: a definition of the user's own with
  // the same name wins, and the names stay free for variables
  'laplacian(f)=d(f,r,r)',
  '',

  'laplacian(r^3)',
  '6*r',

  'norm(v)=v[1]',
  '',

  'norm([3,4])',
  '3',

  'map=5',
  '',

  'map+1',
  '6',

  'zeta=2',
  '',

  'zeta^2',
  '4',

  'clearall',
  '',

  'e=quote(e)',
  '',

  // back to the builtins
  'norm([3,4])',
  '5',

  'laplacian(x^2+y^2,[x,y])',
  '4',

  'zeta(2)',
  '1/6*pi^2',

  // the variable of an equation is still guessed past a soft function name
  'solve(lambertw(x)=1)',
  'e',
]);
