import { run_test } from '../test-harness';

run_test([
  'leading(5*x^3+x,x)',
  '5',

  // variable guessed
  'leading(5*x^3+x)',
  '5',

  'leading(-x^2+1,x)',
  '-1',

  'leading(1/2*x-3,x)',
  '1/2',

  'leading(7,x)',
  '7',

  'leading(0,x)',
  '0',

  // symbolic coefficients
  'leading(a*t^2+b*t,t)',
  'a',

  'leading(a*x^2+b,y)',
  'a*x^2+b',

  'leading(x^2*y^3+x^3*y,y)',
  'x^2',

  'leading(x^2*y^3+x^3*y,x)',
  'y',

  // (2*x+1)^3 = 8*x^3+...
  'leading((2*x+1)^3,x)',
  '8',

  // factored form 2*(x-1)*(x+1)
  'leading(factor(2*x^2-2),x)',
  '2',

  'leading(sin(x)*x,x)',
  'Stop: leading: 1st argument is not a polynomial in the variable x',

  'leading(1/x,x)',
  'Stop: leading: 1st argument is not a polynomial in the variable x',
]);
