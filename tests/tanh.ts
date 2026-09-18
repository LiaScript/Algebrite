import { run_test } from '../test-harness';

run_test([
  'tanh(x)',
  'tanh(x)',

  'tanh(0)',
  '0',

  'tanh(arctanh(x))',
  'x',

  'tanh(0.0)',
  '0.0',

  'tanh(1.0)',
  '0.761594...',

  'tanh(-1.0)',
  '-0.761594...',

  // tanh(20) = 1 - 8.5e-18, which rounds to 1.0
  'tanh(20.0)',
  '1.0',

  'float(tanh(1))',
  '0.761594...',

  'd(tanh(x),x)',
  '1/(cosh(x)^2)',
]);
