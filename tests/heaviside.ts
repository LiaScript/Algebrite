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
]);
