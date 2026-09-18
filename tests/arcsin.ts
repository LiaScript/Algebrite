import { run_test } from '../test-harness';

run_test([
  'arcsin(-1)',
  '-1/2*pi',

  'arcsin(-1/2)',
  '-1/6*pi',

  'arcsin(0)',
  '0',

  'arcsin(1/2)',
  '1/6*pi',

  'arcsin(1)',
  '1/2*pi',

  'arcsin(sin(-1/2*pi))',
  '-1/2*pi',

  'arcsin(sin(-1/6*pi))',
  '-1/6*pi',

  'arcsin(sin(0))',
  '0',

  'arcsin(sin(1/6*pi))',
  '1/6*pi',

  'arcsin(sin(1/2*pi))',
  '1/2*pi',

  // arcsin(sin(x)) is x only for x in [-pi/2, pi/2], e.g. arcsin(sin(pi)) is 0
  'arcsin(sin(x))',
  'arcsin(sin(x))',

  'arcsin(1/sqrt(2))',
  '1/4*pi',

  'arcsin(-1/sqrt(2))',
  '-1/4*pi',

  'arcsin(sin(1/4*pi))',
  '1/4*pi',

  'arcsin(sin(-1/4*pi))',
  '-1/4*pi',

  'arcsin(sqrt(3)/2)',
  '1/3*pi',

  'arcsin(-sqrt(3)/2)',
  '-1/3*pi',

  'arcsin(sqrt(2)/2)',
  '1/4*pi',

  // principal branch of arcsin(sin(u)) for constant u outside [-pi/2, pi/2]
  'arcsin(sin(4/5*pi))',
  '1/5*pi',

  'arcsin(sin(7/5*pi))',
  '-2/5*pi',

  'arcsin(sin(13/6*pi))',
  '1/6*pi',

  'arcsin(sin(3))',
  '-3+pi',

  'arcsin(sin(2))',
  '-2+pi',

  'arcsin(sin(1/5*pi))',
  '1/5*pi',

  'arcsin(sin(3.0))',
  '0.141593...',

  // floats
  'arcsin(0.0)',
  '0.0',

  'arcsin(0.5)',
  '0.523599...',

  'arcsin(1.0)',
  '1.570796...',

  'arcsin(-1.0)',
  '-1.570796...',

  'arcsin(1/3)',
  'arcsin(1/3)',

  'float(arcsin(1/3))',
  '0.339837...',

  // outside [-1,1] there is no real value
  'arcsin(2)',
  'arcsin(2)',

  'arcsin(x)',
  'arcsin(x)',

  'd(arcsin(x),x)',
  '1/((-x^2+1)^(1/2))',
]);
