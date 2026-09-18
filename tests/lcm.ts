import { run_test } from '../test-harness';

run_test([
  'lcm(4,6)',
  '12',

  'lcm(4*x,6*x*y)',
  '12*x*y',

  // multiple arguments

  'lcm(2,3,4)',
  '12',

  'lcm(0,5)',
  '0',

  'lcm(0,0)',
  '0',

  // non-negative for integers
  'lcm(-4,6)',
  '12',

  'lcm(-4,-6)',
  '12',

  // lcm of the numerators over the gcd of the denominators
  'lcm(1/2,1/3)',
  '1',

  // 4/3 = 2*(2/3) = 3*(4/9)
  'lcm(2/3,4/9)',
  '4/3',

  'lcm(5)',
  '5',

  'lcm(a,a^2)',
  'a^2',

  // (x-1)*(x+1)
  'lcm(x^2-1,x+1)',
  'x^2-1',

  'lcm(t^2-1,t+1)',
  't^2-1',

  // (x-1)*(x+1)^2
  'lcm(x^2-1,x^2+2*x+1)',
  'x^3+x^2-x-1',

  // (x+1)*(x-1)^2
  'lcm(x^2-1,x^2-2*x+1)',
  'x^3-x^2-x+1',

  'lcm(x+1,x-1)',
  'x^2-1',

  'lcm(x^2+1,x+1)',
  'x^3+x^2+x+1',

  // x^4-4 = (x^2-2)*(x^2+2)
  'lcm(x^2-2,x^4-4)',
  'x^4-4',

  'lcm(x^2-y^2,x+y)',
  'x^2-y^2',

  'lcm(x,y)',
  'x*y',
]);
