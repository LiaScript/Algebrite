import { run_test } from '../test-harness';

run_test([
  'arctanh(0.0)',
  '0.0',

  'arctanh(0)',
  '0',

  // tanh is a bijection from the reals to (-1,1), so this holds for every real x
  'arctanh(tanh(x))',
  'x',

  'arctanh(0.5)',
  '0.549306...',

  'arctanh(-0.5)',
  '-0.549306...',

  'float(arctanh(1/2))',
  '0.549306...',

  // domain boundary and outside
  'arctanh(1.0)',
  'inf',

  'arctanh(2.0)',
  'Stop: arctanh function argument is not in the interval [-1,1]',

  'arctanh(x)',
  'arctanh(x)',

  'd(arctanh(x),x)',
  '1/(-x^2+1)',
]);
