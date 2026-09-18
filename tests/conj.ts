import { run_test } from '../test-harness';

run_test([
  'conj(0)',
  '0',

  // real numbers (conj(3) used to be 3*(-1)^0)
  'conj(3)',
  '3',

  'conj(-3)',
  '-3',

  'conj(2.5)',
  '2.5',

  'conj(i)',
  '-i',

  'conj(3+4*i)',
  '3-4*i',

  'conj(-2.5*i+1.0)',
  '1.0+2.5*i',

  'conj(x+i*y)',
  'x-i*y',

  'conj(exp(i*x))',
  'exp(-i*x)',

  'conj((-1)^(1/3))',
  '1/2-1/2*i*3^(1/2)',

  'conj(1/(1+i))',
  '1/2+1/2*i',

  'conj(sqrt(-4))',
  '-2*i',

  'conj(conj(3+4*i))',
  '3+4*i',

  '(3+4*i)*conj(3+4*i)',
  '25',

  'conj([1+i,2-3*i])',
  '[1-i,2+3*i]',
]);
