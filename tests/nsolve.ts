import { run_test } from '../test-harness';

// Numeric real roots of arbitrary equations; solve() stays exact.
run_test([
  'nsolve(cos(x)=x,x,1)',
  '0.739085...',

  'nsolve(exp(x)=3,x,0)',
  '1.098612...',

  'nsolve(x^2-2,x,1)',
  '1.414214...',

  // bisection: sign change in the interval
  'nsolve(x^2-2,x,[0,2])',
  '1.414214...',

  'nsolve(sin(x),x,[3,4])',
  '3.141593...',

  // secant: no sign change in the interval
  'nsolve(x^2-2,x,[1,1.2])',
  '1.414214...',

  // variable guessed, start value 0
  'nsolve(x^3+x-1)',
  '0.682328...',

  'nsolve(log(t)=1,t,2)',
  '2.718282...',

  'nsolve(a*x-1,x,1)',
  'Stop: nsolve: expression does not evaluate to a real number: -1.0+1.0*a',

  // no real root
  'nsolve(x^2+1,x,1)',
  'Stop: nsolve: no convergence, try another start value',

  'nsolve(x-1,x,[0,1,2])',
  'Stop: nsolve: interval must be [a,b]',

  // the start value is already a root, f'(x0) = 0 there
  'nsolve(x^2,x,0)',
  '0.0',

  // interval endpoints that are roots
  'nsolve(x^2-1,x,[-1,1])',
  '-1.0',

  'nsolve(x^2-1,x,[0,1])',
  '1.0',

  // sign change from a pole, not a root
  'nsolve(tan(x),x,[1,2])',
  'Stop: nsolve: sign change without a root, the function has a pole',

  'nsolve(1/(x-1),x,[0,3])',
  'Stop: nsolve: sign change without a root, the function has a pole',

  'nsolve(tan(x),x,[3,3.5])',
  '3.141593...',

  // reversed interval
  'nsolve(x^2-2,x,[2,0])',
  '1.414214...',

  'nsolve(x^2-2,x,[-2,0])',
  '-1.414214...',

  // Newton cycles between 0 and 1
  'nsolve(x^3-2*x+2,x,0)',
  'Stop: nsolve: no convergence, try another start value',

  'nsolve(x^3-2*x+2,x,[-2,-1])',
  '-1.769292...',

  'nsolve(exp(x),x,0)',
  'Stop: nsolve: no convergence, try another start value',

  'nsolve(x^2+1,x,[0,1])',
  'Stop: nsolve: no convergence, try another interval',

  // log(10)/log(2)
  'nsolve(2^x=10,x,3)',
  '3.321928...',

  // omega constant, W(1)
  'nsolve(x*exp(x)=1,x,[0,1])',
  '0.567143...',

  'nsolve(x^2==2,x,-1)',
  '-1.414214...',

  'nsolve(sqrt(x)-2,x,1)',
  '4.0',

  'nsolve(x-1,x,[a,b])',
  'Stop: nsolve: expression does not evaluate to a real number: a',
]);
