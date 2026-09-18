import { run_test } from '../test-harness';

// heaviside(x) = (1+sgn(x))/2, so heaviside(0) = 1/2 (SymPy convention)
// and d(heaviside(x),x) = dirac(x) via the existing sgn derivative.
run_test([
  'heaviside(3)',
  '1',

  'heaviside(-2)',
  '0',

  'heaviside(0)',
  '1/2',

  // a float literal anywhere makes Algebrite evaluate in float mode
  'heaviside(2.5)',
  '1.0',

  'heaviside(x)',
  '1/2+1/2*sgn(x)',

  'd(heaviside(x),x)',
  'dirac(x)',

  // heaviside(0) = 1/2 for floats too (sgn(0.0) is 0)
  'heaviside(0.0)',
  '0.5',

  'heaviside(-0.0)',
  '0.5',

  'heaviside(1/3)',
  '1',

  'heaviside(-1/3)',
  '0',

  // shifted and reflected steps
  'heaviside(x-1)',
  '1/2+1/2*sgn(x-1)',

  'heaviside(x)+heaviside(-x)',
  '1',

  'eval(heaviside(x-2),x,3)',
  '1',

  'eval(heaviside(x-2),x,1)',
  '0',

  // derivatives: dirac is even, chain and product rule
  'd(heaviside(x-1),x)',
  'dirac(-x+1)',

  'd(heaviside(2*x),x)',
  '2*dirac(2*x)',

  'd(x*heaviside(x),x)',
  '1/2+1/2*sgn(x)+x*dirac(x)',
]);
