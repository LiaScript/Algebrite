import { run_test } from '../test-harness';

// apart / partfrac share the partial fraction routine of the two-argument
// expand(f, x), but keep repeated factors in factored form.
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

  // a repeated factor keeps its factored form
  'apart(1/((x-1)^2*(x+2)),x)',
  '1/(3*(x-1)^2)-1/(9*(x-1))+1/(9*(x+2))',

  'apart(1/(x^2*(x+1)),x)',
  '1/x^2-1/x+1/(x+1)',

  'rationalize(apart(1/((x-1)^2*(x+2)),x))',
  '1/((x-1)^2*(x+2))',

  'apart(1/(y^2-1),y)',
  '1/(2*(y-1))-1/(2*(y+1))',

  'partfrac(1/(x^2-1),x)',
  '1/(2*(x-1))-1/(2*(x+1))',

  'rationalize(apart((5*x+1)/((x-1)*(x+2)),x))',
  '(5*x+1)/((x-1)*(x+2))',

  // repeated irreducible quadratic next to a linear factor
  'apart(1/((x-1)*(x^2+1)^2),x)',
  '1/(4*(x-1))-1/(2*(x^2+1)^2)-1/(4*(x^2+1))-x/(2*(x^2+1)^2)-x/(4*(x^2+1))',

  'rationalize(apart(1/((x-1)*(x^2+1)^2),x))',
  '1/((x-1)*(x^2+1)^2)',
]);
