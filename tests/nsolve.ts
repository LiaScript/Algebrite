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
]);
