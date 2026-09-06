import { run_test } from '../test-harness';

run_test([
  'limit(x^2,x,2)',
  '4',

  'limit(x+1,x,0)',
  '1',

  'limit((x^2-4)/(x-2),x,2)',
  '4',

  'limit(sin(x)/x,x,0)',
  '1',
]);
