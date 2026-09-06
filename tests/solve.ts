import { run_test } from '../test-harness';

run_test([
  'solve(x^2-4,x)',
  '[-2,2]',

  'solve(x^2-4==0,x)',
  '[-2,2]',

  'solve(x-4,x)',
  '4',

  'solve(a*x+b,x)',
  '-b/a',

  'solve(x^2+1,x)',
  '[-i,i]',
]);
