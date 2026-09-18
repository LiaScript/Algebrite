import { run_test } from '../test-harness';

run_test([
  'a = 1',
  '',

  'a',
  '1',

  'clearall',
  '',

  'a',
  'a',

  // an error keeps all definitions
  'a=1',
  '',

  'f(x)=x+a',
  '',

  'y=0',
  '',

  '1/y',
  'Stop: divide by zero',

  'stop',
  'Stop: user stop',

  'a',
  '1',

  'f(1)',
  '2',

  // the index of a sum is restored even when the summand stops
  'k=7',
  '',

  'sum(1/(k-2),k,1,3)',
  'Stop: divide by zero',

  'k',
  '7',

  'product(1/(k-2),k,1,3)',
  'Stop: divide by zero',

  'k',
  '7',

  // clearall removes variables and functions
  'clearall',
  '',

  'a',
  'a',

  'f(1)',
  'f(1)',

  'k',
  'k',

  // clearall removes patterns and resets settings, units(1) included
  'pattern(q(a_),r(a_))',
  'q(a_)->r(a_)',

  'units(1)',
  '1',

  'clearall',
  '',

  'simplify(q(1))',
  'q(1)',

  'units()',
  '0',

  // plain symbols again, no conversion
  '12cm+5m',
  '12*cm+5*m',
]);
