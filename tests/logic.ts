import { run_test } from '../test-harness';

// and/or/not, the test* comparisons, test() and check().
// tests/test.ts covers the truth tables, this file the edge cases.
run_test([
  // empty and single argument: neutral elements
  'and()',
  '1',

  'or()',
  '0',

  'and(1)',
  '1',

  'or(0)',
  '0',

  // nested logic
  'and(1,and(1,or(0,1)))',
  '1',

  'not(or(0,0))',
  '1',

  'or(and(1,0),not(1))',
  '0',

  'not(and(1,0,1))',
  '1',

  // a false argument decides, even next to an undecidable one
  'and(a,0)',
  '0',

  'or(1,a)',
  '1',

  // otherwise an undecidable argument keeps the call
  'and(1,a)',
  'and(1,a)',

  'or(0,a<b)',
  'or(0,a<b)',

  // comparisons of rationals and floats
  '1/3<1/2',
  '1',

  '1/2<1/3',
  '0',

  'testlt(-1/2,-1/3)',
  '1',

  '0.5==1/2',
  '1',

  '1/3==0.3333333333',
  '0',

  '0.3333<1/3',
  '1',

  'testge(2,2.0)',
  '1',

  'testle(3,2.9999)',
  '0',

  // irrational constants are compared numerically
  'testlt(pi,22/7)',
  '1',

  'testgt(sqrt(2),1.4142)',
  '1',

  'testlt(sqrt(2),1.4143)',
  '1',

  'testgt(exp(1),2.718)',
  '1',

  'testlt(exp(1),2.719)',
  '1',

  'testlt(log(2),0.7)',
  '1',

  'testeq(sqrt(4),2)',
  '1',

  // infinity
  'testgt(inf,10^100)',
  '1',

  'testlt(-inf,-10^100)',
  '1',

  'inf==inf',
  '1',

  'inf>inf',
  '0',

  'testge(inf,inf)',
  '1',

  '-inf<inf',
  '1',

  // symbolic: decidable when the difference is a number
  'testeq(x,x)',
  '1',

  'testeq(x+1,1+x)',
  '1',

  'testeq(x^2-1,(x-1)*(x+1))',
  '1',

  'testlt(x,x+1)',
  '1',

  'testle(x,x)',
  '1',

  'testge(x,x)',
  '1',

  'testgt(x,x)',
  '0',

  'testlt(x,x)',
  '0',

  // undecidable: stays unevaluated
  'testeq(a,b)',
  'a==b',

  'testgt(x,1)',
  'x>1',

  'x<1',
  'x<1',

  // complex numbers have no order
  'testlt(i,1)',
  'i<1',

  'testeq(i,i)',
  '1',

  'testeq(1+i,1-i)',
  '0',

  // test(): lazy, only the chosen branch is evaluated
  'y=0',
  '',

  'test(1>2,1/y,2)',
  '2',

  'test(y==0,0,1/y)',
  '0',

  'y=quote(y)',
  '',

  // no condition true and no default: 0
  'test(0,a)',
  '0',

  'test(0,a,0,b)',
  '0',

  // any nonzero number counts as true
  'test(2,a,b)',
  'a',

  'test(-1/2,a,b)',
  'a',

  'test(a==a,yes,no)',
  'yes',

  // undecidable condition: unevaluated
  'test(x<1,a,b)',
  'test(x<1,a,b)',

  // nested
  'test(1<2,test(3<2,a,b),c)',
  'b',

  // piecewise function
  'f(x)=test(x<0,-x,x)',
  '',

  'f(-3)',
  '3',

  'f(0)',
  '0',

  'f(5/2)',
  '5/2',

  'f(-0.5)',
  '0.5',

  'f=quote(f)',
  '',

  // check()
  'check(1<2)',
  '1',

  'check(2<1)',
  '0',

  'check(x<1)',
  'check(x<1)',

  'check(testeq(a,b))',
  'check(a==b)',

  'check(and(1<2,2<3))',
  '1',
]);
