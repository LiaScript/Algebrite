import { run_test } from '../test-harness';

run_test([
  'real(a+i*b)',
  'a',

  'real(1+exp(i*pi/3))',
  '3/2',

  'real(i)',
  '0',

  'real((-1)^(1/3))',
  '1/2',

  'real(0)',
  '0',

  'real(3)',
  '3',

  'real(-2.5)',
  '-2.5',

  'real(3+4*i)',
  '3',

  'real(3.0-4.0*i)',
  '3.0',

  'real(x)',
  'x',

  'real(i*x)',
  '0',

  'real(exp(i*x))',
  'cos(x)',

  'real(1/(1+i))',
  '1/2',

  'real((1+i)^2)',
  '0',

  'real(sqrt(-4))',
  '0',

  'real([1+i,2-3*i])',
  '[1,2]',
]);
