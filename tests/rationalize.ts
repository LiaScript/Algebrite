import { run_test } from '../test-harness';

run_test([
  'rationalize(a/b+c/d)',
  '(a*d+b*c)/(b*d)',

  'rationalize(t*y/(t+y)+2*t^2*y*(2*t+y)^(-2))',
  't*y*(6*t^2+y^2+6*t*y)/((t+y)*(2*t+y)^2)',

  'rationalize(x^(-2*a)+x^(-4*a))',
  '(1+x^(2*a))/(x^(4*a))',

  'rationalize(x^(1/3)+x^(2/3))',
  'x^(1/3)*(1+x^(1/3))',

  'rationalize(rect(-(-1)^(3/4)))',
  '(1-i)/(2^(1/2))',

  'rationalize(0)',
  '0',

  'rationalize(x)',
  'x',

  'rationalize(1/2+1/3)',
  '5/6',

  'rationalize(1/x^2+1/x)',
  '(x+1)/(x^2)',

  'rationalize(1/(x-1)+1/(x+1))',
  '2*x/((x-1)*(x+1))',

  'rationalize([1/a+1/b,1])',
  '[(a+b)/(a*b),1]',
]);
