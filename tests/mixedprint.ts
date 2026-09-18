import { ava_run, run_test, test } from '../test-harness';

run_test([
  '1.0',
  '1.0',

  '1111 * 1111.0',
  '1234321.0',

  '1111.0 * 1111',
  '1234321.0',

  '1111.0 * 1111.0',
  '1234321.0',

  '11111111 * 11111111.0',
  '123456787654321.0',

  '11111111.0 * 11111111',
  '123456787654321.0',

  '11111111.0 * 11111111.0',
  '123456787654321.0',

  // from 10^15 on, doubles no longer hold every integer digit (the exact
  // product is 12345678987654321), so these print in scientific notation
  '111111111 * 111111111.0',
  '1.234568...*10^16',

  '111111111.0 * 111111111',
  '1.234568...*10^16',

  '111111111.0 * 111111111.0',
  '1.234568...*10^16',

  '999999999999999.0',
  '999999999999999.0',

  '1.0*10^15',
  '1.0*10^15',

  // below 0.001 fixed notation would show fewer than 3 significant digits
  // (and 0.000000... looked like zero), so these are scientific too
  '0.001',
  '0.001',

  '0.00123',
  '0.00123',

  '0.000123',
  '1.23*10^(-4)',

  '1.0*10^(-6)',
  '1.0*10^(-6)',

  '1.0*10^(-7)',
  '1.0*10^(-7)',

  '-2.5*10^(-9)',
  '-2.5*10^(-9)',

  'float(pi)*10^(-8)',
  '3.141593...*10^(-8)',

  'float(10^25)',
  '1.0*10^25',

  '-float(2^70)',
  '-1.180592...*10^21',

  'float(10^(-400))',
  '0.0',

  'float(1/7*10^(-5))',
  '1.428571...*10^(-6)',

  // wrapped where the plain notation would be read differently
  '(1.5*10^(-7))^x',
  '(1.5*10^(-7))^x',

  'x^(1.5*10^(-7))',
  'x^(1.5*10^(-7))',

  '2.5*10^(-7)*x',
  '2.5*10^(-7)*x',

  'printlatex(1.5*10^(-7))',
  '1.5 \\cdot 10^{-7}',

  // ------------------------------------------
  'maxFixedPrintoutDigits',
  '6',

  'maxFixedPrintoutDigits=20',
  '',

  'maxFixedPrintoutDigits',
  '20',

  '1.0*10^(-15)',
  '0.000000000000001',

  'printhuman',
  '0.000000000000001',

  'printcomputer',
  '0.000000000000001',

  'printlatex',
  '0.000000000000001',

  'printlist',
  '0.000000000000001',

  'print2dascii',
  '0.000000000000001',

  'forceFixedPrintout=0',
  '',

  '1.0*10^(-15)',
  '1.0*10^(-15)',

  'printhuman',
  '1.0*10^(-15)',

  'printcomputer',
  '1.0*10^(-15)',

  'printlatex',
  '1.0\\mathrm{e}{-15}',

  'printlist',
  '1.0*10^(-15)',

  'print2dascii',
  '1.0*10^(-15)',

  'forceFixedPrintout=1',
  '',

  'maxFixedPrintoutDigits=6',
  '',

  // ------------------------------------------

  'float(pi)',
  '3.141593...',

  'print("hello")',
  '"hello"',

  '-sqrt(2)/2',
  '-1/2*2^(1/2)',

  // we can't get rid of the multiplication sign
  // in general, because expressions like
  // (x+1)(x-1) actually represent a function call
  // We could get rid of the multiplication sign
  // in these special cases where there are numeric
  // constants but we don't do that yet.
  'printhuman',
  '-1/2 2^(1/2)',

  'printcomputer',
  '-1/2*2^(1/2)',

  'printlatex',
  '-\\frac{\\sqrt{2}}{2}',

  'printlist',
  '(multiply -1/2 (power 2 1/2))',

  'printlist(a+b)\nprintlist(c+d)',
  '(add a b)(add c d)',

  'print2dascii',
  '   1   1/2\n- --- 2\n   2',

  'last2dasciiprint',
  '"   1   1/2\n- --- 2\n   2"',

  // checks that no extra newlines are
  // inserted
  'x=0\ny=2\nfor(do(x=sqrt(2+x),y=2*y/x,printcomputer(y)),k,1,2)',
  '2*2^(1/2)4*2^(1/2)/((2+2^(1/2))^(1/2))',

  'clearall',
  '',

  'print2dascii([[a,b],[c,d]])',
  'a   b\n\nc   d',

  'print2dascii(x^(1/a))',
  ' 1/a\nx',

  'print2dascii(x^(a/b))',
  ' a/b\nx',

  'print2dascii(x^(1/(a+b)))',
  ' 1/(a + b)\nx',

  'print2dascii(-sqrt(2)/2)',
  '   1   1/2\n- --- 2\n   2',

  'print2dascii(1/sqrt(-15))',
  '        1/2\n    (-1)\n- -----------\n    1/2  1/2\n   3    5',

  'print2dascii(x^(a/2))',
  ' 1/2 a\nx',

  // ------------------------------------------

  '(5/3)!',
  '(5/3)!',

  'printhuman',
  '(5/3)!',

  'printcomputer',
  '(5/3)!',

  'printlatex',
  '(\\frac{5}{3})!',

  'printlist',
  '(factorial 5/3)',

  'print2dascii',
  '  5\n(---)!\n  3',

  // bug #106 ---------------------------------
  // printing terms that are not "normalised"
  // following an eval, one can't assume that
  // the numbers are all leading, hence some
  // checks had to be refined when printing
  // the signs

  'clearall',
  '',

  'print(quote(k*(-2)))',
  'k*(-2)',

  'print(quote(k*(-1/2)))',
  'k*(-1/2)',

  'print(quote(k*2))',
  'k*2',

  'print(quote(k*1/2))',
  'k*1/2',

  'print(k*(-2))',
  '-2*k',

  'print(k*(-1/2))',
  '-1/2*k',

  'print(k*2)',
  '2*k',

  'print(k*1/2)',
  '1/2*k',
]);
