import { run_test } from '../test-harness';

// print, printhuman, printcomputer, print2dascii, printlist.
// printlatex has its own file. The tests run with test_flag set, where
// printhuman still separates factors with a space.
run_test([
  // every argument is printed, one per line
  'print(1,x^2,a/b)',
  '1\nx^2\na/b',

  'printcomputer(a,b)',
  'a\nb',

  'print()',
  '',

  'print(quote(a+a))',
  'a+a',

  // negative exponents
  'printcomputer(x^(-2))',
  '1/x^2',

  'printhuman(x^(-2))',
  '1 / x^2',

  'print2dascii(x^(-2))',
  '  1\n----\n  2\n x',

  'printlist(x^(-2))',
  '(power x -2)',

  // rationals
  'printcomputer(-3/4)',
  '-3/4',

  'printhuman(2^(-3)*a)',
  '1/8 a',

  'print2dascii(-3/4)',
  '   3\n- ---\n   4',

  'printlist(-3/4)',
  '-3/4',

  // nested fractions
  'printcomputer(1/(1+1/x))',
  '1/(1+1/x)',

  'printhuman(a/(b/c+d))',
  'a / (d + b / c)',

  'print2dascii(1/(1+1/x))',
  '    1\n---------\n      1\n 1 + ---\n      x',

  'printlist(1/(1+1/x))',
  '(power (add 1 (power x -1)) -1)',

  // several factors in the denominator
  'printcomputer(a*b^(-1)*c^(-2))',
  'a/(b*c^2)',

  'printhuman(a*b^(-1)*c^(-2))',
  'a / (b c^2)',

  'print2dascii(a*b^(-1)*c^(-2))',
  '   a\n------\n    2\n b c',

  // fractional and negative fractional exponents
  'printcomputer(-x^(-1/2))',
  '-1/(x^(1/2))',

  'print2dascii(x^(2/3))',
  ' 2/3\nx',

  'printlist(-x^(-1/2))',
  '(multiply -1 (power x -1/2))',

  // matrices
  'printcomputer([[1,-1/2],[x^(-1),y]])',
  '[[1,-1/2],[1/x,y]]',

  'printhuman([[1,-1/2],[x^(-1),y]])',
  '[[1,-1/2],[1 / x,y]]',

  'print2dascii([[1,-1/2],[x^(-1),y]])',
  '           1\n  1     - ---\n           2\n\n  1\n ---      y\n  x',

  // differences and negated sums
  'printhuman(x-y)',
  'x - y',

  'printcomputer(-(a+b))',
  '-a-b',

  'printlist(x-y)',
  '(add x (multiply -1 y))',

  // the print functions return nothing themselves
  'a=printcomputer(x^2)',
  'x^2',

  'a',
  '',
]);
