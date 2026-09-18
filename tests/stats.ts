import { run_test } from '../test-harness';

// variance/sd divide by n (population), svariance/ssd by n-1 (sample).
// Results stay exact for exact input.
run_test([
  'mean([1,2,3,4])',
  '5/2',

  'mean(1,2,3)',
  '2',

  'mean([a,b])',
  '1/2*a+1/2*b',

  'mean([1.5,2.5])',
  '2.0',

  'median([3,1,2])',
  '2',

  'median([4,1,3,2])',
  '5/2',

  // undecidable order: unevaluated, like min/max
  'median([a,b,c])',
  'median([a,b,c])',

  'variance([2,4,4,4,5,5,7,9])',
  '4',

  'sd([2,4,4,4,5,5,7,9])',
  '2',

  'svariance([2,4,4,4,5,5,7,9])',
  '32/7',

  'ssd([1,2,3])',
  '1',

  'svariance([1])',
  'Stop: variance: not enough data',

  'mean()',
  'Stop: mean: no data',

  // random is not deterministic: only check the range
  'r=random()',
  '',

  'and(r>=0,r<1)',
  '1',

  'n=random(1,6)',
  '',

  'and(n>=1,n<=6,isinteger(n))',
  '1',

  'random(6,1)',
  'Stop: random: use random() or random(a,b) with integers a <= b',
]);
