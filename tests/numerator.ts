import { run_test } from '../test-harness';

run_test([
  'numerator(2/3)',
  '2',

  'numerator(x)',
  'x',

  'numerator(1/x)',
  '1',

  'numerator(a+b)',
  'a+b',

  'numerator(1/a+1/b)',
  'a+b',

  'numerator(0)',
  '0',

  'numerator(-2/3)',
  '-2',

  'numerator(0.5)',
  '0.5',

  'numerator(12345678901234567890/7)',
  '12345678901234567890',

  'numerator(x/y)',
  'x',

  'numerator(-x/y)',
  '-x',

  'numerator(x^(-2))',
  '1',

  'numerator(x/(2*y))',
  'x',

  'numerator(sqrt(2)/3)',
  '2^(1/2)',

  'numerator(1/sqrt(2))',
  '1',

  'numerator(a/b+c)',
  'a+b*c',

  'numerator(1/(x-1)+1/(x+1))',
  '2*x',
]);
