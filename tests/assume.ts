import { run_test } from '../test-harness';

// Assumptions about symbols: assume(x, property) or assume(x > 0), and the
// queries isreal, ispositive, isnegative, isnonzero, isinteger. A query is
// 1 or 0 when it can be decided and stays unevaluated otherwise.
run_test([
  // without assumptions, symbols are real (assumeRealVariables=1) and
  // nothing else is known
  'isreal(x)',
  '1',

  'ispositive(x)',
  'ispositive(x)',

  'isnonzero(x)',
  'isnonzero(x)',

  'isinteger(x)',
  'isinteger(x)',

  // numbers and constants
  'ispositive(3)',
  '1',

  'ispositive(-2/3)',
  '0',

  'isnegative(-2.5)',
  '1',

  'isnonzero(0)',
  '0',

  'ispositive(pi)',
  '1',

  // (the test setup makes e a plain symbol, so Euler's number is exp(1))
  'ispositive(exp(1))',
  '1',

  'isreal(i)',
  '0',

  'isnonzero(i)',
  '1',

  'isreal(1+i)',
  '0',

  'isinteger(4/2)',
  '1',

  // properties imply others
  'assume(x,positive)',
  '',

  'ispositive(x)',
  '1',

  'isnegative(x)',
  '0',

  'isnonzero(x)',
  '1',

  'isreal(x)',
  '1',

  'assume(n,integer)',
  '',

  'isinteger(n)',
  '1',

  'isreal(n)',
  '1',

  'ispositive(n)',
  'ispositive(n)',

  // several facts combine
  'assume(n,nonzero)',
  '',

  'isnonzero(n)',
  '1',

  'assumptions()',
  '["n: integer, nonzero","x: positive"]',

  // relations as a short form
  'assume(y<0)',
  '',

  'isnegative(y)',
  '1',

  'assume(z>=0)',
  '',

  'isnegative(z)',
  '0',

  'ispositive(z)',
  'ispositive(z)',

  'assume(w!=0)',
  '',

  'isnonzero(w)',
  '1',

  // expressions
  'ispositive(x^2+1)',
  '1',

  'ispositive(z+x)',
  '1',

  'isnegative(y*x)',
  '1',

  'ispositive(y^2)',
  '1',

  'ispositive(y^3)',
  '0',

  'isnegative(y^3)',
  '1',

  'ispositive(exp(y))',
  '1',

  'ispositive(abs(w))',
  '1',

  'ispositive(sqrt(x))',
  '1',

  'ispositive(x-1)',
  'ispositive(x-1)',

  'isinteger(n^2+3*n)',
  '1',

  'isinteger(n/2)',
  'isinteger(1/2*n)',

  'isreal(sin(x))',
  '1',

  'isreal(sqrt(y))',
  '0',

  'isreal(sqrt(a))',
  'isreal(a^(1/2))',

  // contradictions stop, and leave the old assumptions in place
  'assume(x,negative)',
  'Stop: assume: x can not be negative, it is already assumed positive',

  'ispositive(x)',
  '1',

  'assume(y>0)',
  'Stop: assume: y can not be positive, it is already assumed negative',

  // bad input
  'assume(x,prime)',
  'Stop: assume: unknown property prime, use real, positive, negative, nonzero, integer or complex',

  'assume(3,positive)',
  'Stop: assume: 3 is not a symbol',

  // forget one symbol, or all
  'forget(x)',
  '',

  'ispositive(x)',
  'ispositive(x)',

  'isinteger(n)',
  '1',

  'forget()',
  '',

  'isinteger(n)',
  'isinteger(n)',

  'assumptions()',
  '',

  // a value bound to the symbol wins
  'assume(v,positive)',
  '',

  'v=-3',
  '',

  'ispositive(v)',
  '0',

  // clearall forgets everything
  'assume(q,positive)',
  '',

  'clearall',
  '',

  'ispositive(q)',
  'ispositive(q)',
]);

// Rules that use the assumptions. Without assumptions the results stay as
// before (see the last block).
run_test([
  'assume(x,positive)',
  '',

  'assume(y,negative)',
  '',

  'assume(n,integer)',
  '',

  // abs and sqrt
  'abs(x)',
  'x',

  'abs(y)',
  '-y',

  'abs(-2*x)',
  '2*x',

  'abs(x*y)',
  '-x*y',

  'abs(y^3)',
  '-y^3',

  'sqrt(x^2)',
  'x',

  'sqrt(y^2)',
  '-y',

  'sqrt(4*x^2)',
  '2*x',

  'abs(exp(y))',
  'exp(y)',

  // sgn
  'sgn(x)',
  '1',

  'sgn(y)',
  '-1',

  'sgn(x*y)',
  '-1',

  // comparisons
  'x>0',
  '1',

  'y<0',
  '1',

  'x>y',
  '1',

  'test(y<0,a,b)',
  'a',

  'max(x,y)',
  'x',

  'min(x,0)',
  '0',

  // arg
  'arg(x)',
  '0',

  'arg(y)',
  'pi',

  // log: log(a^b) = b log(a) needs a > 0
  'log(x^2)',
  '2*log(x)',

  'log(y^2)',
  '2*log(-y)',

  'log(-y)',
  'log(-y)',

  'log(x*y^2)',
  'log(x)+2*log(-y)',
]);

// without assumptions: unchanged, except that log no longer assumes z > 0
run_test([
  'abs(z)',
  'abs(z)',

  'sqrt(z^2)',
  'abs(z)',

  'sgn(z)',
  'sgn(z)',

  'z>0',
  'testgt(z,0)',

  'arg(z)',
  'arg(z)',

  'log(z^2)',
  '2*log(abs(z))',

  // log(-z) = log(z) + i pi needs z > 0
  'log(-z)',
  'log(-z)',
]);
