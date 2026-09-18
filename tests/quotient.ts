import { run_test } from '../test-harness';

run_test([
  'quotient(x^2+1,x+1)-x+1',
  '0',

  'quotient(a*x^2+b*x+c,d*x+e)-(-a*e/(d^2)+a*x/d+b/d)',
  '0',

  'quotient(x^3-1,x-1)',
  'x^2+x+1',

  'quotient(x^2,x)',
  'x',

  'quotient(x^2+1,x^2+1)',
  '1',

  'quotient(1,x+1)',
  '0',

  'quotient(x^3+2*x+1,x^2)',
  'x',

  'quotient(2*x^2+3,2*x+1)',
  'x-1/2',

  'quotient(x^4+1,x^2+i)',
  'x^2-i',

  'quotient(x^2+y,x)',
  'x',

  'quotient(y^2+2*y+1,y+1,y)',
  'y+1',

  'quotient(6,3)',
  '2',

  'quotient(7,2)',
  '7/2',

  'quotient(x^2+1,0)',
  'Stop: divide by zero',
]);
