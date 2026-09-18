import { run_test } from '../test-harness';

// min/max are variadic and use the same subtract-then-sign comparison as
// testlt/testgt, so they stay unevaluated when the order is undecidable.
// The x=5 binding is kept last: clearall runs once per file, not per pair.
run_test([
  'min(1,2)',
  '1',

  'max(1,2)',
  '2',

  'min(3,1,2)',
  '1',

  'max(3,1,2)',
  '3',

  'max(2,2)',
  '2',

  'min(1/2,0.3)',
  '0.3',

  'max(pi,3)',
  'pi',

  // a float literal anywhere makes Algebrite evaluate in float mode
  'min(sqrt(2),1.5)',
  '1.414214...',

  'min(x,1)',
  'min(x,1)',

  'max(1,x,2)',
  'max(1,x,2)',

  'min(-x,x)',
  'min(-x,x)',

  'min(a,a+1)',
  'a',

  'x=5',
  '',

  'min(x,7)',
  '5',

  'max(x,7)',
  '7',

  'x=quote(x)',
  '',

  'max()',
  'Stop: max: no data',

  'min()',
  'Stop: min: no data',

  'min(3)',
  '3',

  // rationals and infinity
  'max(1/3,1/4)',
  '1/3',

  'min(-1/3,-1/4)',
  '-1/3',

  'max(pi,22/7)',
  '22/7',

  'max(inf,10^100)',
  'inf',

  'min(-inf,0)',
  '-inf',

  // comparable symbolic arguments
  'max(x,x+1)',
  'x+1',

  'min(x-1,x,x+1)',
  'x-1',

  // complex numbers have no order
  'max(i,1)',
  'max(i,1)',
]);
