import { run_test } from '../test-harness';

run_test([
  'arccos(1)',
  '0',

  'arccos(1/2)',
  '1/3*pi',

  'arccos(0)',
  '1/2*pi',

  'arccos(-1/2)',
  '2/3*pi',

  'arccos(-1)',
  'pi',

  'arccos(cos(0))',
  '0',

  'arccos(cos(1/3*pi))',
  '1/3*pi',

  'arccos(cos(1/2*pi))',
  '1/2*pi',

  'arccos(cos(2/3*pi))',
  '2/3*pi',

  'arccos(cos(pi))',
  'pi',

  // arccos(cos(x)) is x only for x in [0, pi], e.g. arccos(cos(-1)) is 1
  'arccos(cos(x))',
  'arccos(cos(x))',

  'arccos(1/sqrt(2))',
  '1/4*pi',

  'arccos(-1/sqrt(2))',
  '3/4*pi',

  'arccos(cos(1/4*pi))',
  '1/4*pi',

  'arccos(cos(3/4*pi))',
  '3/4*pi',

  'arccos(sqrt(3)/2)',
  '1/6*pi',

  'arccos(-sqrt(3)/2)',
  '5/6*pi',

  // principal branch of arccos(cos(u)) for constant u outside [0, pi]
  'arccos(cos(7/5*pi))',
  '3/5*pi',

  'arccos(cos(-7))',
  '7-2*pi',

  'float(arccos(cos(-7)))',
  '0.716815...',

  'arccos(cos(4))',
  '-4+2*pi',

  'arccos(cos(5/2))',
  '5/2',

  'arccos(cos(2*pi))',
  '0',

  'arccos(cos(3*pi))',
  'pi',

  // floats
  'arccos(0.5)',
  '1.047198...',

  'arccos(-0.5)',
  '2.094395...',

  'arccos(1.0)',
  '0.0',

  'arccos(-1.0)',
  '3.141593...',

  'float(arccos(1/3))',
  '1.230959...',

  // outside [-1,1] there is no real value
  'arccos(2)',
  'arccos(2)',

  'arccos(x)',
  'arccos(x)',

  'd(arccos(x),x)',
  '-1/((-x^2+1)^(1/2))',
]);
