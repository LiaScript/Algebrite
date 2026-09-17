import { run_test } from '../test-harness';

// apart / partfrac are the standard CAS names for Algebrite's two-argument
// expand(f, x), which does partial fraction decomposition.
run_test([
  'apart(1/(x^2-1),x)',
  '1/(2*(x-1))-1/(2*(x+1))',

  'apart((5*x+1)/((x-1)*(x+2)),x)',
  '2/(x-1)+3/(x+2)',

  // improper fraction: polynomial part first
  'apart(x^3/(x^2-1),x)',
  'x+1/(2*(x-1))+1/(2*(x+1))',

  // irreducible quadratic factor
  'apart(1/(x^3+x),x)',
  '1/x-x/(x^2+1)',

  'apart(1/(y^2-1),y)',
  '1/(2*(y-1))-1/(2*(y+1))',

  'partfrac(1/(x^2-1),x)',
  '1/(2*(x-1))-1/(2*(x+1))',

  'rationalize(apart((5*x+1)/((x-1)*(x+2)),x))',
  '(5*x+1)/((x-1)*(x+2))',
]);
