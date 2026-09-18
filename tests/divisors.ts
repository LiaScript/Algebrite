import { run_test } from '../test-harness';

run_test([
  'divisors(12)',
  '[1,2,3,4,6,12]',

  'divisors(-12)',
  '[1,2,3,4,6,12]',

  'divisors(a)',
  '[1,a]',

  'divisors(-a)',
  '[1,a]',

  'divisors(+3*x+3)',
  '[1,3,1+x,3+3*x]',

  'divisors(+3*x-3)',
  '[1,3,-3+3*x,-1+x]',

  'divisors(-3*x+3)',
  '[1,3,1-x,3-3*x]',

  'divisors(-3*x-3)',
  '[1,3,1+x,3+3*x]',

  'divisors(1)',
  '[1]',

  'divisors(-1)',
  '[1]',

  'divisors(97)',
  '[1,97]',

  'divisors(2^10)',
  '[1,2,4,8,16,32,64,128,256,512,1024]',

  'divisors(30)',
  '[1,2,3,5,6,10,15,30]',

  'divisors(x^2)',
  '[1,x,x^2]',

  'divisors(2*a*b)',
  '[1,2,a,b,2*a,2*a*b,2*b,a*b]',

  // divisors of the content, the sum itself is not factored
  'divisors(4*x^2-4)',
  '[1,2,4,-4+4*x^2,-2+2*x^2,-1+x^2]',

  'divisors(0)',
  'Stop: divisors: every integer divides 0',

  'divisors(1/2)',
  'Stop: divisors: integer or polynomial term expected',

  'divisors(2.0)',
  'Stop: divisors: integer or polynomial term expected',
]);
