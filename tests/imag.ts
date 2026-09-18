import { run_test } from '../test-harness';

run_test([
  'imag(a+i*b)',
  'b',

  'imag(1+exp(i*pi/3))',
  '1/2*3^(1/2)',

  'imag(i)',
  '1',

  'imag((-1)^(1/3))',
  '1/2*3^(1/2)',

  'imag(-i)',
  '-1',

  'imag(0)',
  '0',

  'imag(3)',
  '0',

  'imag(3+4*i)',
  '4',

  'imag(3.0-4.0*i)',
  '-4.0',

  'imag(x)',
  '0',

  'imag(i*x)',
  'x',

  'imag(exp(i*x))',
  'sin(x)',

  'imag(1/(1+i))',
  '-1/2',

  'imag((1+i)^2)',
  '2',

  'imag(sqrt(-4))',
  '2',

  'imag([1+i,2-3*i])',
  '[1,-3]',
]);
