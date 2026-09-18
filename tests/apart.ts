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

  // All results below were checked with sympy to equal the input.

  // nothing to decompose
  'apart(1/(x+1),x)',
  '1/(x+1)',

  'apart(5,x)',
  '5',

  'apart(0,x)',
  '0',

  'apart(x^2+1,x)',
  'x^2+1',

  'apart(1/x^3,x)',
  '1/x^3',

  'apart(1/((x-1)^3),x)',
  '1/((x-1)^3)',

  'apart(1/(x^2+1)^2,x)',
  '1/((x^2+1)^2)',

  // irreducible over Q
  'apart(1/(x^2-2),x)',
  '1/(x^2-2)',

  'apart((x+1)/(x^2+2*x+1),x)',
  '1/(x+1)',

  // polynomial part
  'apart(x/(x+1),x)',
  '1-1/(x+1)',

  'apart((x^4+1)/(x^2-1),x)',
  '1+x^2+1/(x-1)-1/(x+1)',

  'apart(x^5/((x-1)^2*(x^2+1)),x)',
  '2+x+1/(2*(x-1)^2)+2/(x-1)-1/(2*(x^2+1))',

  // repeated roots
  'apart(x^2/((x-1)^3),x)',
  '1/((x-1)^3)+2/((x-1)^2)+1/(x-1)',

  'apart(x^3/(x+1)^4,x)',
  '-1/((x+1)^4)+3/((x+1)^3)-3/((x+1)^2)+1/(x+1)',

  // rational and negative leading coefficients
  'apart(1/(2*x^2-2),x)',
  '1/(4*(x-1))-1/(4*(x+1))',

  'apart(1/(-x^2+1),x)',
  '-1/(2*(x-1))+1/(2*(x+1))',

  'apart(3/(2*x+1)/(x-3),x)',
  '3/(7*(x-3))-6/(7*(2*x+1))',

  'apart(1/((x-1)*(x-2)*(x-3)),x)',
  '1/(2*(x-3))-1/(x-2)+1/(2*(x-1))',

  'apart(1/(x^3-x),x)',
  '-1/x+1/(2*(x-1))+1/(2*(x+1))',

  // irreducible quadratics, also repeated and mixed with linear factors
  'apart(1/(x^4-1),x)',
  '1/(4*(x-1))-1/(4*(x+1))-1/(2*(x^2+1))',

  'apart(1/(x^3-1),x)',
  '1/(3*(x-1))-2/(3*(x^2+x+1))-x/(3*(x^2+x+1))',

  'apart(1/((x+1)^2*(x^2+1)),x)',
  '1/(2*(x+1)^2)+1/(2*(x+1))-x/(2*(x^2+1))',

  'apart(1/((x^2+x+1)^2*(x-1)),x)',
  '1/(9*(x-1))-2/(3*(x^2+x+1)^2)-2/(9*(x^2+x+1))-x/(3*(x^2+x+1)^2)-x/(9*(x^2+x+1))',

  'apart(1/(x^2*(x^2+1)^2),x)',
  '1/x^2-1/((x^2+1)^2)-1/(x^2+1)',

  'apart((2*x+3)/(x^2+2*x+5),x)',
  '3/(x^2+2*x+5)+2*x/(x^2+2*x+5)',

  'apart(1/((x-1)*(x^2+2)),x)',
  '1/(3*(x-1))-1/(3*(x^2+2))-x/(3*(x^2+2))',

  'apart(1/((x^2+1)*(x^2+4)),x)',
  '1/(3*(x^2+1))-1/(3*(x^2+4))',

  'apart(1/((x^2+2)*(x^2+3)),x)',
  '1/(x^2+2)-1/(x^2+3)',

  'apart(1/((x^2-2)*(x^2+3)),x)',
  '1/(5*(x^2-2))-1/(5*(x^2+3))',

  'apart(1/(x^4+5*x^2+6)^2,x)',
  '1/((x^2+2)^2)-2/(x^2+2)+1/((x^2+3)^2)+2/(x^2+3)',

  'apart(1/(x^4+4),x)',
  '1/(4*(x^2-2*x+2))+1/(4*(x^2+2*x+2))-x/(8*(x^2-2*x+2))+x/(8*(x^2+2*x+2))',

  'apart(1/(x^6-1),x)',
  '1/(6*(x-1))-1/(6*(x+1))-1/(3*(x^2+x+1))-1/(3*(x^2-x+1))-x/(6*(x^2+x+1))+x/(6*(x^2-x+1))',

  // an irreducible quintic stays a single fraction
  'apart(1/(x^5-x+1),x)',
  '1/(x^5-x+1)',

  // symbolic coefficients
  'apart(1/(x^2-a^2),x)',
  '-1/(2*a*(x+a))+1/(2*a*(x-a))',

  'apart(1/((x-a)*(x-b)),x)',
  '1/((a-b)*(x-a))-1/((a-b)*(x-b))',

  // not a rational function of x: unchanged (was Stop: divide by zero)
  'apart(sin(x)/(x^2-1),x)',
  'sin(x)/(x^2-1)',

  'apart(1/(x^2-1),y)',
  '1/(x^2-1)',

  // variable guessed
  'apart(1/(x^2-1))',
  '1/(2*(x-1))-1/(2*(x+1))',

  'partfrac(1/(x^2*(x+1)))',
  '1/x^2-1/x+1/(x+1)',
]);
