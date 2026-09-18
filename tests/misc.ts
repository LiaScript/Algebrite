import { run } from '../runtime/run';
import { run_test, setup_test, test } from '../test-harness';

// filter, decomp, operator
run_test([
  // filter removes the terms that contain any of the variables
  'filter(x^2+x+1,x)',
  '1',

  'filter(x*y+x+y+1,x)',
  'y+1',

  'filter(a*x+b+c*y,x,y)',
  'b',

  'filter(x^2+sin(x)+1,x)',
  '1',

  'filter(sin(x)*y+2,y)',
  '2',

  'filter(x,x)',
  '0',

  'filter(3,x)',
  '3',

  // no variable: nothing to remove
  'filter(x^2+1)',
  'x^2+1',

  // tensor entries that contain a variable become 0
  'filter([1,x,2],x)',
  '[1,0,2]',

  'filter([[x,1],[2,y]],x,y)',
  '[[0,1],[2,0]]',

  // decomp returns the parts that are constant in the variable
  'decomp(a*x+b,x)',
  '[a,b,-b]',

  'decomp(x*sin(a)+cos(b),x)',
  '[sin(a),cos(b),-cos(b)]',

  // the whole expression is constant
  'decomp(sin(a),x)',
  'sin(a)',

  'decomp(1,x)',
  '1',

  // the variable defaults to x
  'decomp(a*x+b)',
  '[a,b,-b]',

  // operator() just builds an inert node
  'operator(f,x)',
  'operator(f,x)',

  'operator()',
  'operator()',
]);

// symbolsinfo lists every symbol with its value (builtins included)
setup_test(() =>
  test('symbolsinfo', t => {
    run('aa=3');
    run('bb=x+1');
    const info = run('symbolsinfo') as string;
    t.is(true, info.includes('symbol: aa size: 1 value: 3...'));
    t.is(true, info.includes('symbol: bb size: 6 value: 1+x...'));
    run('clear(aa,bb)');
    t.is(false, (run('symbolsinfo') as string).includes('value: 3...'));
  })
);
