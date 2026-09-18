import { run_test } from '../test-harness';

run_test([
  'Gamma(a)',
  'Gamma(a)',

  //  "float(gamma(10))",
  //  "362880",

  'Gamma(x+1)',
  'x*Gamma(x)',

  'Gamma(1/2)',
  'pi^(1/2)',

  'Gamma(x-1)-Gamma(x)/(-1+x)',
  '0',

  'Gamma(-x)',
  '-pi/(x*Gamma(x)*sin(pi*x))',

  // Gamma(n) = (n-1)!
  'Gamma(1)',
  '1',

  'Gamma(2)',
  '1',

  'Gamma(5)',
  '24',

  'Gamma(21)',
  '2432902008176640000',

  // half-integers: Gamma(n+1/2) = (2n)!/(4^n n!) sqrt(pi)
  'Gamma(3/2)',
  '1/2*pi^(1/2)',

  'Gamma(5/2)',
  '3/4*pi^(1/2)',

  'Gamma(7/2)',
  '15/8*pi^(1/2)',

  'Gamma(-1/2)',
  '-2*pi^(1/2)',

  'Gamma(-3/2)',
  '4/3*pi^(1/2)',

  'Gamma(-5/2)',
  '-8/15*pi^(1/2)',

  // other rationals have no closed form
  'Gamma(1/3)',
  'Gamma(1/3)',

  // poles
  'Gamma(-1)',
  'Stop: divide by zero',

  'Gamma(-1.0)',
  'Stop: divide by zero',

  'Gamma(0.0)',
  'Stop: divide by zero',

  // numeric values
  'Gamma(5.0)',
  '24.0',

  'Gamma(0.5)',
  '1.772454...',

  'Gamma(2.5)',
  '1.329340...',

  'Gamma(0.1)',
  '9.513508...',

  'Gamma(-0.5)',
  '-3.544908...',

  'Gamma(-1.5)',
  '2.363272...',

  'float(Gamma(1/3))',
  '2.678939...',

  'float(Gamma(7/2))',
  '3.323351...',

  // reflection formula
  'Gamma(1-x)',
  'pi/(Gamma(x)*sin(pi*x))',

  'Gamma(n+1)/Gamma(n)',
  'n',

  // wrong number of arguments
  'Gamma()',
  'Stop: Gamma: expected 1 argument, got 0',
]);
