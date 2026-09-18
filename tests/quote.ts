import { run } from '../runtime/run';
import { run_test, setup_test, test } from '../test-harness';

// do, eval, quote, binding, lookup, clear, equals, stop and assignments
run_test([
  // do evaluates left to right and returns the last result
  'do(a=3,b=a+1,a*b)',
  '12',

  'a',
  '3',

  'b',
  '4',

  'do(1,2,3)',
  '3',

  'do(1)',
  '1',

  // nothing to evaluate: nothing to return
  'do()',
  '',

  'clear(a,b)',
  '',

  // eval(expr, x, value, ...) substitutes, then evaluates
  'eval(x^2+1,x,3)',
  '10',

  'eval(x*y,x,2,y,5)',
  '10',

  'eval(x+y,x,y)',
  '2*y',

  'eval(x^2,x,a+1)',
  '1+2*a+a^2',

  'eval(x^2,x,sqrt(2))',
  '2',

  'eval(sin(x),x,pi)',
  '0',

  // x itself is not assigned
  'x',
  'x',

  'eval(3)',
  '3',

  // quote/eval round trips
  'quote(1+2)',
  '1+2',

  'eval(quote(1+2))',
  '3',

  'quote(quote(x))',
  'quote(x)',

  'eval(quote(quote(x)))',
  'x',

  'printcomputer(quote(a*(b+c)))',
  'a*(b+c)',

  'eval(quote(a*(b+c)))',
  'a*b+a*c',

  // assignment evaluates the right side once, at assignment time
  'x=3',
  '',

  'y=x+1',
  '',

  'x=4',
  '',

  'y',
  '4',

  // quote delays it, the value then follows x
  'y=quote(x+1)',
  '',

  'y',
  '5',

  'x=10',
  '',

  'y',
  '11',

  'binding(y)',
  'x+1',

  // := is the same as =quote()
  'z:=x^2',
  '',

  'z',
  '100',

  'binding(z)',
  'x^2',

  'clearall',
  '',

  // lookup shows the immediate content, one level deep
  'x=quote(y)',
  '',

  'y=quote(z)',
  '',

  'x',
  'z',

  'lookup(x)',
  'y',

  'lookup(y)',
  'z',

  'lookup(w)',
  'w',

  // a non-symbol is returned as it is
  'lookup(3)',
  '3',

  'lookup(a+b)',
  'a+b',

  'binding(w)',
  'w',

  'binding(2)',
  'Stop: symbol error',

  // clear removes one or more bindings
  'clear(x,y)',
  '',

  'x',
  'x',

  'y',
  'y',

  'c=5',
  '',

  'clear(c)',
  '',

  'c',
  'c',

  'clear(3)',
  'Stop: symbol error',

  // clear removes the binding, not the symbol: expressions that
  // still contain it keep working (this used to stop with
  // "y not defined")
  'x=quote(y)',
  '',

  'clear(y)',
  '',

  'x',
  'y',

  'x^2-y^2',
  '0',

  'clear(x)',
  '',

  // clearing a builtin or a constant doesn't break it
  'clear(sin)',
  '',

  'sin(0)',
  '0',

  'pi=3',
  '',

  'pi',
  '3',

  'clear(pi)',
  '',

  'float(pi)',
  '3.141593...',

  // equals is the functional form of =
  'equals(a,3)',
  '',

  'a',
  '3',

  'equals(g(t),t^2)',
  '',

  'g(3)',
  '9',

  'clearall',
  '',

  // assignment to a tensor component
  'v=[1,2,3]',
  '',

  'v[2]=x',
  '',

  'v',
  '[1,x,3]',

  'v[4]=1',
  'Stop: error in indexed assign',

  'M=[[1,2],[3,4]]',
  '',

  'M[2,1]=0',
  '',

  'M',
  '[[1,2],[0,4]]',

  'M[1]',
  '[1,2]',

  '3=x',
  'Stop: symbol assignment: error in symbol',

  // last holds the last result
  '3+4',
  '7',

  'last+1',
  '8',

  // stop aborts
  'stop',
  'Stop: user stop',

  'do(1,stop,2)',
  'Stop: user stop',

  'test(1,stop,2)',
  'Stop: user stop',

  'test(0,stop,2)',
  '2',
]);

// known bug: quote(x+x) prints 2*x. The quoted x+x is returned as it is,
// but top_level_eval then bakes every result, and bake re-evaluates
// polynomials in x, y, z, s and t (bake_poly calls coeff, which calls
// Eval). quote(a+a) stays a+a. Fixing it needs a bake that only
// reorders terms instead of evaluating them.
setup_test(() =>
  test.failing('quote(x+x)', t => t.is('x+x', run('quote(x+x)')))
);
