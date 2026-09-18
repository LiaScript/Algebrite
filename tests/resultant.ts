import { run_test } from '../test-harness';

// resultant(f, g, x) is the determinant of the Sylvester matrix: free of x,
// zero exactly when f and g share a root in x. Values checked by hand.
run_test([
  // eliminates y from the circle and the diagonal: y = x in x^2+y^2-1
  'resultant(x^2+y^2-1,x-y,y)',
  '2*x^2-1',

  // g = x-3 is monic, so the resultant is f(3)
  'resultant(x^2-2,x-3,x)',
  '7',

  'resultant(x^2-2,x-3)',
  '7',

  // common root x = 1
  'resultant(x^2-1,x-1,x)',
  '0',

  // constant g: g^deg(f)
  'resultant(x^2+1,3,x)',
  '9',

  'resultant(0,x,x)',
  '0',

  // f and f': -a times the discriminant b^2-4*a*c
  'resultant(a*x^2+b*x+c,2*a*x+b,x)',
  '-a*b^2+4*a^2*c',

  'resultant(sin(x),x,x)',
  'Stop: resultant: 1st argument is not a polynomial in the variable x',
]);
