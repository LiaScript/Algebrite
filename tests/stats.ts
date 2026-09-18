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

  'random(3)',
  'Stop: random: use random() or random(a,b) with integers a <= b',

  'random(1,2,3)',
  'Stop: random: use random() or random(a,b) with integers a <= b',

  'random(1.5,3)',
  'Stop: random: use random() or random(a,b) with integers a <= b',

  'random(a,b)',
  'Stop: random: use random() or random(a,b) with integers a <= b',

  'random(1,1)',
  '1',

  'n=random(-3,-1)',
  '',

  'and(n>=-3,n<=-1,isinteger(n))',
  '1',

  // single values
  'mean(5)',
  '5',

  'median([7])',
  '7',

  'variance(5)',
  '0',

  'sd([5])',
  '0',

  'ssd([5])',
  'Stop: variance: not enough data',

  'svariance(1,2)',
  '1/2',

  'variance([1,1,1])',
  '0',

  // rationals stay exact
  'mean(1/2,1/3)',
  '5/12',

  'median([1/2,1/3,1/4])',
  '1/3',

  // sd([1,2,3,4]) = sqrt(5/4)
  'sd([1,2,3,4])',
  '1/2*5^(1/2)',

  // ssd = sqrt(32/7)
  'ssd([2,4,4,4,5,5,7,9])',
  '4*2^(1/2)/(7^(1/2))',

  // floats
  'variance([1.0,2.0,3.0])',
  '0.666667...',

  'sd([1.0,2.0,3.0,4.0])',
  '1.118034...',

  'median([2.5,1,3])',
  '2.5',

  // median sorts first, duplicates and negative values
  'median([3,1,2,2])',
  '2',

  'median([-1,-5,3])',
  '-1',

  'median([-4,-1,-3,-2])',
  '-5/2',

  // comparable symbolic values
  'median([pi,3,4])',
  'pi',

  'median([sqrt(2),1.4,1.5])',
  '2^(1/2)',

  'median([x,x+1,x+2])',
  'x+1',

  'median([x+2,x,x+1,x+3])',
  'x+3/2',

  'median([inf,1,2])',
  '2',

  'median([1,a])',
  'median([1,a])',

  // symbolic data
  'mean(x)',
  'x',

  'variance([a,b])',
  '-1/2*a*b+1/4*a^2+1/4*b^2',

  'svariance([a,b])',
  '-a*b+1/2*a^2+1/2*b^2',

  'sd([a,a])',
  '0',

  // quantities
  'mean([quantity(1,m),quantity(3,m)])',
  '2*m',

  'median()',
  'Stop: median: no data',

  'variance()',
  'Stop: variance: no data',

  'sd()',
  'Stop: sd: no data',
]);

// complex data: the squared deviation is |d|^2 = d conj(d), not d^2
run_test([
  'variance([i,-i])',
  '1',

  'variance([1+i,1-i,3])',
  '14/9',

  'sd([i,-i])',
  '1',

  // symbolic data are real, unchanged by conj
  'variance([a,b])',
  '-1/2*a*b+1/4*a^2+1/4*b^2',
]);
