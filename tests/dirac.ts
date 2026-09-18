import { run_test } from '../test-harness';

run_test([
  'dirac(-x)',
  'dirac(x)',

  // even: the sign of the argument is normalized
  'dirac(-2*x)',
  'dirac(2*x)',

  'dirac(x-1)-dirac(1-x)',
  '0',

  // zero away from the origin
  'dirac(1)',
  '0',

  'dirac(-1/2)',
  '0',

  'dirac(2.5)',
  '0',

  // dirac(0) has no value (it is not 1)
  'dirac(0)',
  'dirac(0)',

  'dirac(0.0)',
  'dirac(0.0)',

  'eval(d(heaviside(x),x),x,1)',
  '0',

  'eval(d(heaviside(x),x),x,0)',
  'dirac(0)',

  // dirac(x^2) is not dirac(x): i = (-1)^(1/2) is not -1
  'dirac(x^2)',
  'dirac(x^2)',

  'dirac(i)',
  'dirac(i)',

  // chain rule through sgn
  'd(sgn(x^2),x)',
  '4*x*dirac(x^2)',

  // wrong number of arguments
  'dirac()',
  'Stop: dirac: expected 1 argument, got 0',
]);
