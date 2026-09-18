import { run_test } from '../test-harness';

run_test([
  'arctan(x)',
  'arctan(x)',

  'arctan(-x)',
  '-arctan(x)',

  'arctan(0)',
  '0',

  // arctan(tan(x)) is x only for x in (-pi/2, pi/2), e.g. arctan(tan(pi)) is 0
  'arctan(tan(x))',
  'arctan(tan(x))',

  'arctan(1/sqrt(3))-pi/6', // 30 degrees
  '0',

  'arctan(1)-pi/4', // 45 degrees
  '0',

  'arctan(sqrt(3))-pi/3', // 60 degrees
  '0',

  'arctan(a-b)',
  'arctan(a-b)',

  'arctan(b-a)',
  '-arctan(a-b)',

  'arctan(sin(x)/cos(x))',
  'arctan(sin(x)/cos(x))',

  // principal branch of arctan(tan(u)) for constant u
  'arctan(tan(4/5*pi))',
  '-1/5*pi',

  'arctan(tan(11/4*pi))',
  '-1/4*pi',

  'arctan(tan(2))',
  '2-pi',

  'arctan(tan(-3))',
  '-3+pi',

  'float(arctan(tan(-3)))',
  '0.141593...',

  'arctan(tan(pi))',
  '0',

  'arctan(sin(2/3*pi)/cos(2/3*pi))',
  '-1/3*pi',

  'arctan(sin(3)/cos(3))',
  '3-pi',

  // negative special values
  'arctan(-1)',
  '-1/4*pi',

  'arctan(-sqrt(3))',
  '-1/3*pi',

  'arctan(-1/sqrt(3))',
  '-1/6*pi',

  // floats
  'arctan(0.0)',
  '0.0',

  'arctan(1.0)',
  '0.785398...',

  'arctan(-1.0)',
  '-0.785398...',

  'arctan(1/2)',
  'arctan(1/2)',

  'float(arctan(2))',
  '1.107149...',

  'd(arctan(x),x)',
  '1/(x^2+1)',

]);
