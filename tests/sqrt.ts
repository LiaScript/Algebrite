import { run_test } from '../test-harness';

// sqrt, and the formula functions cbrt(x)=x^(1/3), root(x,n)=x^(1/n)
run_test([
  'sqrt(0)',
  '0',

  'sqrt(1)',
  '1',

  'sqrt(4)',
  '2',

  'sqrt(2)',
  '2^(1/2)',

  'sqrt(8)',
  '2*2^(1/2)',

  'sqrt(12)',
  '2*3^(1/2)',

  'sqrt(1/4)',
  '1/2',

  'sqrt(8/9)',
  '2/3*2^(1/2)',

  'sqrt(10^100)',
  '100000000000000000000000000000000000000000000000000',

  'sqrt(2.0)',
  '1.414214...',

  'sqrt(-1)',
  'i',

  'sqrt(-4)',
  '2*i',

  'sqrt(-2.0)',
  '1.414214...*i',

  // principal square roots of complex numbers
  'sqrt(i)',
  '1/2*2^(1/2)+1/2*i*2^(1/2)',

  'sqrt(-i)',
  '-(-1)^(3/4)',

  'sqrt(1+i)',
  'i*2^(1/4)*sin(1/8*pi)+2^(1/4)*cos(1/8*pi)',

  'sqrt(x^2)',
  'abs(x)',

  'sqrt(x)^2',
  'x',

  'sqrt(inf)',
  'inf',

  'd(sqrt(x),x)',
  '1/(2*x^(1/2))',

  'cbrt(0)',
  '0',

  'cbrt(8)',
  '2',

  'cbrt(27/8)',
  '3/2',

  'cbrt(2)',
  '2^(1/3)',

  'cbrt(16)',
  '2*2^(1/3)',

  // principal cube root of -8 is 2*exp(i*pi/3), not -2
  'cbrt(-8)',
  '2*(-1)^(1/3)',

  'rect(cbrt(-8))',
  '1+i*3^(1/2)',

  'cbrt(2.0)',
  '1.259921...',

  'cbrt(-27.0)',
  '1.500000...+2.598076...*i',

  'cbrt(i)',
  '1/2*i+1/2*3^(1/2)',

  // (x^3)^(1/3) is not x for complex x
  'cbrt(x^3)',
  '(x^3)^(1/3)',

  'root(16,4)',
  '2',

  'root(32,5)',
  '2',

  'root(8,3)',
  '2',

  'root(2,1)',
  '2',

  'root(0,2)',
  '0',

  'root(x,2)',
  'x^(1/2)',

  'root(x,n)',
  'x^(1/n)',

  'root(-32,5)',
  '2*(-1)^(1/5)',

  'root(2.0,2)',
  '1.414214...',

  'float(root(10,3))',
  '2.154435...',

  'root(2,0)',
  'Stop: divide by zero',

  'sqrt(-1.0-2.0*i)',
  '0.786151...-1.272020...*i',

  'float(sqrt(-1-2*i))',
  '0.786151...-1.272020...*i',
]);
