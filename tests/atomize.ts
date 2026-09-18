import { run_test } from '../test-harness';

run_test([
  'atomize(a+b+c)',
  '[a,b,c]',

  'atomize(a*b)',
  '[a,b]',

  'atomize(x^2)',
  '[x,2]',

  // only the top level is split; terms come in internal canonical order
  'atomize(a*b+c)',
  '[c,a*b]',

  'atomize(sin(x))',
  'x',

  'atomize(x)',
  'x',

  'atomize(3)',
  '3',

  // differences, negation and reciprocals are sums, products and powers
  'atomize(a-b)',
  '[a,-b]',

  'atomize(-x)',
  '[-1,x]',

  'atomize(1/x)',
  '[x,-1]',

  'atomize(2*x)',
  '[2,x]',

  'atomize(f(x,y,z))',
  '[x,y,z]',

  // a vector is an atom, it comes back unchanged
  'atomize([1,2])',
  '[1,2]',

  // relations
  'atomize(x<1)',
  '[x,1]',

  'atomize(a==b)',
  '[a,b]',

  // numbers are atoms
  'atomize(1/2)',
  '1/2',

  'atomize(2.5)',
  '2.5',

  // unevaluated input keeps its terms
  'atomize(quote(1+2+3))',
  '[1,2,3]',
]);
