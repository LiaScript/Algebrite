import { run_test } from '../test-harness';

run_test([
  'x=0\ny=2\nfor(do(x=sqrt(2+x),y=2*y/x), k,1,9)\nfloat(y)',
  '3.141588...',

  'for(do(x=sqrt(2+x),y=2*y/x),k,1,iterations)',
  'for(do(x=sqrt(2+x),y=2*y/x),k,1,iterations)',

  'clearall',
  '',

  // for(body, i, a, b) returns nothing
  's=0',
  '',

  'for(s=s+n,n,1,5)',
  '',

  's',
  '15',

  // the loop variable is restored afterwards
  'n',
  'n',

  'k=7',
  '',

  'for(s=k,k,1,3)',
  '',

  's',
  '3',

  'k',
  '7',

  // zero iterations: an empty range, or b < a (no counting down)
  's=0',
  '',

  'for(s=s+1,i,1,0)',
  '',

  's',
  '0',

  'for(s=s+i,i,5,1)',
  '',

  's',
  '0',

  // a single iteration, negative bounds
  'for(s=s+i,i,3,3)',
  '',

  's',
  '3',

  's=0',
  '',

  'for(s=s+i,i,-3,-1)',
  '',

  's',
  '-6',

  // nested loops
  's=0',
  '',

  'for(for(s=s+i*j,j,1,2),i,1,2)',
  '',

  's',
  '9',

  // the loop variable is restored even when the body stops
  'k=7',
  '',

  'for(test(k==2,stop,0),k,1,3)',
  'Stop: user stop',

  'k',
  '7',

  // non-integer or symbolic bounds leave the loop unevaluated
  'for(1,i,1,2.5)',
  'for(1,i,1,2.5)',

  'for(1,i,a,3)',
  'for(1,i,a,3)',

  'for(1,2,1,3)',
  'Stop: for: 2nd arg should be the variable to loop over',
]);
