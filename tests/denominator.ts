import { run_test } from '../test-harness';

run_test([
  'denominator(2/3)',
  '3',

  'denominator(x)',
  '1',

  'denominator(1/x)',
  'x',

  'denominator(a+b)',
  '1',

  'denominator(1/a+1/b)',
  'a*b',

  // denominator function expands

  'denominator(1/(x-1)/(x-2))',
  'x^2-3*x+2',

  'denominator(0)',
  '1',

  'denominator(-2/3)',
  '3',

  'denominator(0.5)',
  '1',

  'denominator(12345678901234567890/7)',
  '7',

  'denominator(x^(-2))',
  'x^2',

  'denominator(x/(2*y))',
  '2*y',

  'denominator(sqrt(2)/3)',
  '3',

  'denominator(1/sqrt(2))',
  '2^(1/2)',

  'denominator(a/b+c)',
  'b',

  'denominator(1/(x-1)+1/(x+1))',
  'x^2-1',
]);
