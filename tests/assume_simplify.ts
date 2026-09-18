import { run_test } from '../test-harness';

// Rules that use the assumptions: integer symbols in trig functions,
// powers of -1, floor/ceiling/round/mod, and powers of positive bases.
// Every rule only fires when the assumption is known; the "stays" cases
// check that nothing changes without it.
run_test([
  // without assumptions nothing changes
  'sin(n*pi)',
  'sin(n*pi)',

  'cos(n*pi)',
  'cos(n*pi)',

  'tan(x+n*pi)',
  'tan(x+n*pi)',

  '(-1)^(2*n)',
  '(-1)^(2*n)',

  'floor(n)',
  'floor(n)',

  'mod(n,1)',
  'mod(n,1)',

  '(x^a)^b',
  '(x^a)^b',

  '(x^(1/2))^(2*n)',
  '(x^(1/2))^(2*n)',

  'sqrt(x)*sqrt(y)-sqrt(x*y)',
  '-(x*y)^(1/2)+x^(1/2)*y^(1/2)',

  // integer symbols in trig functions
  'assume(n,integer)',
  '',

  'assume(m,integer)',
  '',

  'sin(n*pi)',
  '0',

  'sin(-n*pi)',
  '0',

  'cos(n*pi)',
  '(-1)^n',

  'cos(2*n*pi)',
  '1',

  'tan(n*pi)',
  '0',

  'sin(n*m*pi)',
  '0',

  // sin(x+n*pi) = sin(x)cos(n*pi) + cos(x)sin(n*pi)
  'sin(x+n*pi)',
  '(-1)^n*sin(x)',

  // cos(x+n*pi) = cos(x)cos(n*pi) - sin(x)sin(n*pi)
  'cos(x+n*pi)',
  '(-1)^n*cos(x)',

  'sin(x+2*n*pi)',
  'sin(x)',

  'cos(x-2*n*pi)',
  'cos(x)',

  'tan(x+n*pi)',
  'tan(x)',

  // (2n+1)*pi is pi + 2n*pi
  'cos((2*n+1)*pi)',
  '-1',

  'sin((n+1)*pi)',
  '0',

  // not a multiple of pi, or not known to be an integer
  'sin(n*pi/2)',
  'sin(1/2*n*pi)',

  'sin(x*pi)',
  'sin(pi*x)',

  'sin(n)',
  'sin(n)',

  // powers of -1
  '(-1)^(2*n)',
  '1',

  '(-1)^(2*n+1)',
  '-1',

  '(-1)^(4*n+2)',
  '1',

  '(-1)^n*(-1)^n',
  '1',

  '(-1)^n*(-1)^(n+1)',
  '-1',

  '(-1)^n',
  '(-1)^n',

  '(-1)^(2*x)',
  '(-1)^(2*x)',

  // exp(i*n*pi) = cos(n*pi) + i*sin(n*pi)
  'exp(2*n*pi*i)',
  '1',

  'exp(n*pi*i)',
  '(-1)^n',

  'exp(x*pi*i)',
  'exp(i*pi*x)',

  // floor, ceiling, round and mod of integers
  'floor(n)',
  'n',

  'ceiling(n^2+1)',
  '1+n^2',

  'round(2*n*m)',
  '2*m*n',

  'floor(x)',
  'floor(x)',

  'floor(n/2)',
  'floor(1/2*n)',

  // floor, ceiling and round of a real value are integers
  'floor(floor(x))',
  'floor(x)',

  'sin(ceiling(x)*pi)',
  '0',

  'mod(n,1)',
  '0',

  'mod(2*n,2)',
  '0',

  'mod(2*n,-2)',
  '0',

  'mod(n,2)',
  'mod(n,2)',

  'mod(x,1)',
  'mod(x,1)',

  // an integer power of a power: (a^b)^n = a^(b*n)
  '(x^(1/2))^(2*n)',
  'x^n',

  // (a*b)^n = a^n*b^n for integer n
  '(x*y)^n-x^n*y^n',
  '0',

  'forget()',
  '',

  // powers of positive bases: (x^a)^b = x^(a*b) for x > 0 and real a
  'assume(x,positive)',
  '',

  'assume(y,positive)',
  '',

  '(x^a)^b',
  'x^(a*b)',

  '(x^(1/2))^(1/3)',
  'x^(1/6)',

  '(x^3)^(1/2)',
  'x^(3/2)',

  // (1/y)^(1/2) = y^(-1/2)
  'sqrt(x/y)',
  'x^(1/2)/(y^(1/2))',

  // sqrt(x)*sqrt(y) = sqrt(x*y) for x, y >= 0
  'sqrt(x)*sqrt(y)-sqrt(x*y)',
  '0',

  'simplify(sqrt(x*y)/(sqrt(x)*sqrt(y)))',
  '1',

  'x/abs(x)',
  '1',

  'simplify(abs(x*y)/(x*y))',
  '1',

  // a base that is only real, or an exponent that is not real
  '(w^a)^b',
  '(w^a)^b',

  '(x^(i*a))^b',
  '(x^(i*a))^b',

  'sqrt(x)*sqrt(w)-sqrt(x*w)',
  '-(w*x)^(1/2)+w^(1/2)*x^(1/2)',

  'assume(z,negative)',
  '',

  // z^3 < 0: its cube root is not z
  '(z^3)^(1/3)',
  '(z^3)^(1/3)',

  'z/abs(z)',
  '-1',
]);
