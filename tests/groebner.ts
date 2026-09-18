import { run_test } from '../test-harness';

// groebner(polys, vars, order) returns the reduced Groebner basis, each
// element with integer coefficients and positive leading coefficient. All
// bases were checked against SymPy's groebner() and by hand: every element
// lies in the ideal and every generator reduces to zero modulo the basis.

// lex (default)
run_test([
  'groebner([x*y-1,x-y],[x,y])',
  '[x-y,-1+y^2]',

  // circle meets the diagonal where 2 y^2 = 1
  'groebner([x^2+y^2-1,x-y],[x,y])',
  '[x-y,-1+2*y^2]',

  // Cox, Little, O'Shea: lex eliminates x
  'groebner([x^3-2*x*y,x^2*y-2*y^2+x],[x,y])',
  '[x-2*y^2,y^3]',

  // equations; variables default to the symbols in order of appearance
  'groebner([x^2+y^2+z^2=1,x=y,y=z])',
  '[x-z,y-z,-1+3*z^2]',

  // variable order decides what is eliminated
  'groebner([x*y-1,x-y],[y,x])',
  '[-x+y,-1+x^2]',
]);

// graded orders
run_test([
  'groebner([x^3-2*x*y,x^2*y-2*y^2+x],[x,y],grlex)',
  '[x^2,x*y,-x+2*y^2]',

  // twisted cubic like ideal: grlex needs five elements, grevlex two
  'groebner([x*z-y^2,x^3-z^2],[x,y,z],grlex)',
  '[y^6-z^5,-z^4+x*y^4,-z^3+x^2*y^2,x^3-z^2,-y^2+x*z]',

  'groebner([x*z-y^2,x^3-z^2],[x,y,z],grevlex)',
  '[x^3-z^2,y^2-x*z]',

  'groebner([x^2*y-1,x*y^2-x],[x,y],grevlex)',
  '[-y+x^2,-1+y^2]',
]);

// special cases
run_test([
  // no common zero: the unit ideal
  'groebner([x,x-1],[x,y])',
  '[1]',

  'groebner(1/2*x-1)',
  '[-2+x]',

  'groebner([0,0],[x])',
  '[0]',

  'groebner([sqrt(2)*x],[x])',
  'Stop: groebner: 2^(1/2)*x is not a polynomial with rational coefficients in x',

  'groebner([x^2-a],[x])',
  'Stop: groebner: -a+x^2 is not a polynomial with rational coefficients in x',

  'groebner([x],[x],foo)',
  'Stop: groebner: order must be lex, grlex or grevlex',

  'groebner([x*y],[x,x])',
  'Stop: groebner: variables must be distinct symbols',
]);
