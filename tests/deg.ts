import { run_test } from '../test-harness';

run_test([
  'deg(x^3+1,x)',
  '3',

  // variable guessed
  'deg(x^3+1)',
  '3',

  'deg(x,x)',
  '1',

  // constants, including the zero polynomial, have degree 0 here
  'deg(5,x)',
  '0',

  'deg(0,x)',
  '0',

  'deg(x^2-x^2+x,x)',
  '1',

  'deg(1/2*x^2,x)',
  '2',

  'deg(a*x^2+b*x^5,x)',
  '5',

  'deg(t^4-t,t)',
  '4',

  // multivariate
  'deg(x^2*y^3,y)',
  '3',

  'deg(x^2*y^3,z)',
  '0',

  // factored forms
  'deg(factor(x^2-1),x)',
  '2',

  'deg(factor(x^3-1),x)',
  '3',

  'deg(factor((x^2+1)^2*(x-1)),x)',
  '5',

  'deg(quote((x+1)^3),x)',
  '3',

  // not polynomials
  'deg(1/x,x)',
  'Stop: deg: 1st argument is not a polynomial in the variable x',

  'deg(sin(x),x)',
  'Stop: deg: 1st argument is not a polynomial in the variable x',

  'deg(x^(1/2),x)',
  'Stop: deg: 1st argument is not a polynomial in the variable x',

  'deg(x^a,x)',
  'Stop: deg: 1st argument is not a polynomial in the variable x',

  'deg(x^2+1,2)',
  'Stop: deg: 1st argument is not a polynomial in the variable 2',
]);
