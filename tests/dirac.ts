import { run_test } from '../test-harness';

run_test([
  'dirac(-x)',
  'dirac(x)',

  // wrong number of arguments
  'dirac()',
  'Stop: dirac: expected 1 argument, got 0',
]);
