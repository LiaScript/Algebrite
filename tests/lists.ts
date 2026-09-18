import { run_test } from '../test-harness';

// list helpers (sources/lists.ts), if as a name for test, and ';' between
// statements
run_test([
  // lists
  'length([1,2,3])',
  '3',

  'length([[1,2],[3,4],[5,6]])',
  '3',

  'length(5)',
  '1',

  'append([1,2],[3])',
  '[1,2,3]',

  'append([1,2],3)',
  '[1,2,3]',

  'append([1],[2],[3,4])',
  '[1,2,3,4]',

  'sort([3,1,2])',
  '[1,2,3]',

  'sort([pi,3,sqrt(2),-1/2])',
  '[-1/2,2^(1/2),3,pi]',

  'sort([b,a,c])',
  '[a,b,c]',

  'range(1,5)',
  '[1,2,3,4,5]',

  'range(0,1,1/4)',
  '[0,1/4,1/2,3/4,1]',

  'range(5,1,-2)',
  '[5,3,1]',

  'range(3)',
  '[1,2,3]',

  'table(k^2,k,1,5)',
  '[1,4,9,16,25]',

  'table(x^k,k,0,3)',
  '[1,x,x^2,x^3]',

  'sq(x)=x^2',
  '',

  'map(sq,[1,2,3])',
  '[1,4,9]',

  'map(sin,[0,pi/2])',
  '[0,1]',

  'map(sq,range(1,4))',
  '[1,4,9,16]',

  'sum(k,k,1,length([7,8,9]))',
  '6',

  // if is test: conditions and values in pairs, an optional default last
  'if(1<2,a,b)',
  'a',

  'if(1>2,a,b)',
  'b',

  'sg(x)=if(x>0,1,x<0,-1,0)',
  '',

  'map(sg,[-2,0,3])',
  '[-1,0,1]',

  // a semicolon separates statements like a line break
  'a1=1;b1=2;a1+b1',
  '3',

  'x1=2; x1^10',
  '1024',
]);
