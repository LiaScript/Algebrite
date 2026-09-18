import { run_test } from '../test-harness';

run_test([
  'bessely(x,n)',
  'bessely(x,n)',

  // wrong number of arguments
  'bessely(x)',
  'Stop: bessely: expected 2 arguments, got 1',
]);
