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

  'identity(1)',
  '[[1]]',

  'identity(4)',
  '[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]',

  'unit(2.0)',
  '[[1,0],[0,1]]',

  // no identity matrix for these sizes: left unevaluated
  'unit(0)',
  'unit(0)',

  'unit(-1)',
  'unit(-1)',

  'unit(1.5)',
  'unit(1.5)',

  // H[i,j] = 1/(i+j-1)
  'hilbert(1)',
  '[[1]]',

  'hilbert(2)',
  '[[1,1/2],[1/2,1/3]]',

  'hilbert(3)',
  '[[1,1/2,1/3],[1/2,1/3,1/4],[1/3,1/4,1/5]]',

  'hilbert(2.0)',
  '[[1,1/2],[1/2,1/3]]',

  'hilbert(0)',
  'hilbert(0)',

  'hilbert(-1)',
  'hilbert(-1)',

  'hilbert(n)',
  'hilbert(n)',

  'hilbert(1.5)',
  'hilbert(1.5)',

  'zero(2,3,2)',
  '[[[0,0],[0,0],[0,0]],[[0,0],[0,0],[0,0]]]',

  'zero(2.0,2)',
  '[[0,0],[0,0]]',

  'zero(-1)',
  '0',
]);
