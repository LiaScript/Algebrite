import { run_test } from '../test-harness';

// sec/csc/cot rewrite to 1/cos, 1/sin, 1/tan, so derivative, float and
// simplification come for free from the existing trig code.
run_test([
  'sec(0)',
  '1',

  'sec(pi/3)',
  '2',

  'sec(x)',
  '1/(cos(x))',

  'sec(-x)',
  '1/(cos(x))',

  'float(sec(1))',
  '1.850816...',

  'd(sec(x),x)',
  'sin(x)/(cos(x)^2)',

  'sec(x)*cos(x)',
  '1',

  'csc(pi/2)',
  '1',

  'csc(pi/6)',
  '2',

  'csc(x)',
  '1/(sin(x))',

  'd(csc(x),x)',
  '-cos(x)/(sin(x)^2)',

  'cot(pi/4)',
  '1',

  'cot(pi/3)',
  '1/3^(1/2)',

  'cot(x)',
  '1/(tan(x))',

  'float(cot(1))',
  '0.642093...',
]);
