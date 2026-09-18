import { run_test } from '../test-harness';

// How builtin functions behave on quantities (see quantity.ts). Kept apart
// from units.ts, which covers the quantity/unit machinery itself.
run_test([
  'units(1)',
  '1',

  // --- sign handling -------------------------------------------------------

  '-(3m)',
  '-3*m',

  '2m-5m',
  '-3*m',

  'quantity(-3,m)*quantity(-2,s)',
  '6*m*s',

  'quantity(-3,m)/2',
  '-3/2*m',

  '(1m)/(-2s)',
  '-1/2*m*s^-1',

  '(-2m)^3',
  '-8*m^3',

  '(-4m)^2',
  '16*m^2',

  'float(quantity(-1/3,m))',
  '-0.333333...*m',

  'convert(-3m,cm)',
  '-300',

  'printlatex(-2 m/s^2)',
  '-2\\ \\text{m}\\cdot \\text{s}^{-2}',

  'printlatex(-1/2 m)',
  '-\\frac{1}{2}\\ \\text{m}',

  'print2dascii(-1.5 m)',
  '-1.5 m',

  'printhuman(-3m)',
  '-3 m',

  // --- magnitude-like functions keep the dimension ------------------------

  'abs(-3m)',
  '3*m',

  'abs(quantity(-2,m/s))',
  '2*m*s^-1',

  'dimensionof(abs(-3m))',
  '[1,0,0,0,0,0,0]',

  'sqrt(4m^2)',
  '2*m',

  'sqrt(-4m^2)',
  '(2*i)*m',

  'floor(2.7m)',
  '2.0*m',

  'ceiling(2.3m)',
  '3.0*m',

  'round(2.5m)',
  '3.0*m',

  'min(2m,3m)',
  '2*m',

  'max(-2m,-300cm)',
  '-2*m',

  // --- dimensionless results ----------------------------------------------

  'sgn(-3m)',
  '-1',

  'arg(-3m)',
  'pi',

  'real(-3m)',
  '-3*m',

  'imag(-3m)',
  '0',

  'conj(-3m)',
  '-3*m',

  'conj((2+3*i)*m)',
  '(2-3*i)*m',

  // --- magnitude exactly 1 (1m parses to the bare symbol m) ---------------

  '1m',
  '1*m',

  'min(1m,2m)',
  '1*m',

  '[1m,-2m]',
  '[1*m,-2*m]',

  '1m < 2m',
  '1',

  'km > m',
  '1',

  // --- zero results --------------------------------------------------------

  '5m-5m',
  '0',

  '5m-500cm == 0',
  '1',

  // --- comparisons ---------------------------------------------------------

  '3m == 300cm',
  '1',

  '-3m < -2m',
  '1',

  '-300cm >= -3m',
  '1',

  'abs(1.49km - 1500m) <= 20m',
  '1',

  'abs(1.49km - 1500m) <= 5m',
  '0',

  'not(3m < 2m)',
  '1',

  'or(3m < 2m, 1m < 2m)',
  '1',

  'and(2m < 3m, 3m < 4m)',
  '1',

  'test(3m < 2m, 1, 0)',
  '0',

  '5m < 3kg',
  'Stop: incompatible units: cannot add m and kg',

  // --- quantities mixed with symbols --------------------------------------

  'subst(-2,y,(2m)*y)',
  '-4*m',

  'x*2m/x',
  '2*m',

  '(2m*x + 3m*x)/x',
  '5*m',

  'subst(2,x,quantity(x,m))',
  '2*m',

  'd(quantity(3,m)*x,x)',
  '3*m',

  'subst(2,x,integral(3m,x))',
  '6*m',

  'dot([1m,2m],[3m,4m])',
  '11*m^2',

  // --- functions that need a dimensionless argument ------------------------

  'sin(3m)',
  'Stop: sin: argument must be dimensionless, got m',

  'cos(3m)',
  'Stop: cos: argument must be dimensionless, got m',

  'arctan(3m/s)',
  'Stop: arctan: argument must be dimensionless, got m*s^-1',

  'tanh(3kg)',
  'Stop: tanh: argument must be dimensionless, got kg',

  'exp(3m)',
  'Stop: exp: argument must be dimensionless, got m',

  'log(3m)',
  'Stop: log: argument must be dimensionless, got m',

  'log(8,2m)',
  'Stop: log: argument must be dimensionless, got m',

  '2^(3m)',
  'Stop: power: exponent: argument must be dimensionless, got m',

  // a ratio has no dimension left, so it goes through
  'sin(3m/m)',
  'sin(3)',

  'sin(3m/s*2s/m)',
  'sin(6)',

  'log(3m/m)',
  'log(3)',

  // back to plain symbols: "m" is an ordinary variable again and every
  // one of these stays symbolic, exactly as before units() existed
  'units(0)',
  '0',

  'sin(3m)',
  'sin(3*m)',

  'exp(3m)',
  'exp(3*m)',

  'log(3m)',
  'log(3)+log(m)',

  '2^(3m)',
  '2^(3*m)',
]);
