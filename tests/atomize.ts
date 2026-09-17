import { run_test } from '../test-harness';

run_test([
  'atomize(a+b+c)',
  '[a,b,c]',

  'atomize(a*b)',
  '[a,b]',

  'atomize(x^2)',
  '[x,2]',

  // only the top level is split; terms come in internal canonical order
  'atomize(a*b+c)',
  '[c,a*b]',

  'atomize(sin(x))',
  'x',

  'atomize(x)',
  'x',

  'atomize(3)',
  '3',
]);
