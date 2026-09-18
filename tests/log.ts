import { run_test } from '../test-harness';

run_test([
  'log(1)',
  '0',

  'log(exp(1))',
  '1',

  'log(exp(x))',
  'x',

  'exp(log(x))',
  'x',

  'log(x^2)',
  '2*log(x)',

  'log(1/x)',
  '-log(x)',

  'log(a^b)',
  'b*log(a)',

  'log(2)',
  'log(2)',

  'log(2.0)',
  '0.693147...',

  'float(log(2))',
  '0.693147...',

  'log(a*b)',
  'log(a)+log(b)',

  'log(1/3)+log(3)',
  '0',

  'log(-1)',
  'i*pi',

  'log(-1.0)',
  '3.141593...*i',

  // log(x, base) = log(x)/log(base), exact when x is a power of the base
  'log(8,2)',
  '3',

  'log(1/8,2)',
  '-3',

  'log(1000,10)',
  '3',

  'log(9,27)',
  'log(9)/log(27)',

  'log(10,2)',
  'log(10)/log(2)',

  'log(x,b)',
  'log(x)/log(b)',

  'float(log(8,2))',
  '3.0',

  'log(8.0,2)',
  '3.0',

  'log(e,e)',
  '1',

  'log(1,5)',
  '0',

  'd(log(x,2),x)',
  '1/(x*log(2))',

  'log(0.0)',
  '-inf',

  'log(-2)',
  'log(2)+i*pi',

  'log(-2.0)',
  '0.693147...+3.141593...*i',

  'log(1/2)',
  '-log(2)',

  'log(0.5)',
  '-0.693147...',

  'log(sqrt(x))',
  '1/2*log(x)',

  'log(x/y)',
  'log(x)-log(y)',

  'log(exp(2))',
  '2',

  // principal branch: log(z) = log(abs(z)) + i*arg(z), -pi < arg(z) <= pi
  'log(i)',
  '1/2*i*pi',

  'log(-i)',
  '-1/2*i*pi',

  'log(2*i)',
  'log(2)+1/2*i*pi',

  'log(-2*i)',
  'log(2)-1/2*i*pi',

  'log(1+i)',
  '1/2*log(2)+1/4*i*pi',

  'log(-1-i)',
  '1/2*log(2)-3/4*i*pi',

  'float(log(-i))',
  '-1.570796...*i',

  'log(-1.0*i)',
  '-1.570796...*i',

  'log(2.0*i)',
  '0.693147...+1.570796...*i',

  'float(exp(log(-1-i)))',
  '-1.0-1.000000...*i',

  'log(4,2)',
  '2',

  'log(x,x)',
  '1',

  'log(x^3,x)',
  '3',

  'log(1/9,3)',
  '-2',

  'log(100,10.0)',
  '2.0',

  'log(2.0,8)',
  '0.333333...',

  'log(8,1)',
  'Stop: divide by zero',

  // ln, log10 and log2 are defined as formulas in init.ts
  'ln(1)',
  '0',

  'ln(exp(3))',
  '3',

  'ln(x^2)',
  '2*log(x)',

  'ln(-1)',
  'i*pi',

  'ln(0.5)',
  '-0.693147...',

  'ln(x)-log(x)',
  '0',

  'd(ln(x),x)',
  '1/x',

  'log10(1)',
  '0',

  'log10(10)',
  '1',

  'log10(1000)',
  '3',

  'log10(1/100)',
  '-2',

  'log10(0.001)',
  '-3.000000...',

  'log10(2)',
  'log(2)/log(10)',

  'float(log10(2))',
  '0.301030...',

  'log10(10^x)',
  'x',

  'log10(-10)',
  '1+i*pi/log(10)',

  'd(log10(x),x)',
  '1/(x*log(10))',

  'log2(1)',
  '0',

  'log2(8)',
  '3',

  'log2(1/8)',
  '-3',

  'log2(2^100)',
  '100',

  'log2(0.25)',
  '-2.0',

  'log2(3)',
  'log(3)/log(2)',

  'float(log2(3))',
  '1.584963...',

  'log2(2^n)',
  'n',

  'log2(-1)',
  'i*pi/log(2)',
]);
