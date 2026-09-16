import { run_test } from '../test-harness';

// identity(n) is the standard CAS name for the existing unit(n).
run_test([
  'identity(2)',
  '[[1,0],[0,1]]',

  'identity(3)',
  '[[1,0,0],[0,1,0],[0,0,1]]',

  'dot(identity(2),[[a,b],[c,d]])',
  '[[a,b],[c,d]]',

  'identity(n)',
  'unit(n)',
]);
