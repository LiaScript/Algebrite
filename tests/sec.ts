import { run_test } from '../test-harness';

// sec/csc/cot rewrite to 1/cos, 1/sin, cos/sin (sech/csch/coth likewise), so derivative, float and
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
  'cos(x)/sin(x)',

  'float(cot(1))',
  '0.642093...',

  // special angles, signs and periodicity
  'sec(pi)',
  '-1',

  'sec(pi/4)',
  '2^(1/2)',

  'sec(2*pi/3)',
  '-2',

  'sec(1.0)',
  '1.850816...',

  'csc(pi/4)',
  '2^(1/2)',

  'csc(-pi/2)',
  '-1',

  'csc(-x)',
  '-1/sin(x)',

  'csc(1.0)',
  '1.188395...',

  // cot(pi/2) is 0 (it was left as 1/tan(pi/2) with cot(x)=1/tan(x))
  'cot(pi/2)',
  '0',

  'cot(3*pi/2)',
  '0',

  'cot(pi/6)',
  '3^(1/2)',

  'cot(-pi/4)',
  '-1',

  'cot(3*pi/4)',
  '-1',

  'cot(-x)',
  '-cos(x)/sin(x)',

  'cot(1.0)',
  '0.642093...',

  // -csc(x)^2 = -1-cot(x)^2
  'd(cot(x),x)',
  '-1-cos(x)^2/(sin(x)^2)',

  // poles
  'sec(pi/2)',
  'Stop: divide by zero',

  'csc(0)',
  'Stop: divide by zero',

  'cot(0)',
  'Stop: divide by zero',

  'cot(pi)',
  'Stop: divide by zero',

  // identities
  'simplify(sec(x)^2-tan(x)^2)',
  '1',

  'simplify(cot(x)*tan(x))',
  '1',

  // hyperbolic companions
  'sech(1.0)',
  '0.648054...',

  'csch(1.0)',
  '0.850918...',

  'csch(0)',
  'Stop: divide by zero',

  'coth(x)',
  '1/(tanh(x))',

  'coth(1.0)',
  '1.313035...',

  'coth(0)',
  'Stop: divide by zero',

  // -csch(x)^2
  'd(coth(x),x)',
  '-1/(cosh(x)^2*tanh(x)^2)',
]);
