import { run_test } from '../test-harness';

run_test([
  'circexp(cos(x))',
  '1/2*exp(-i*x)+1/2*exp(i*x)',

  'circexp(sin(x))',
  '1/2*i*exp(-i*x)-1/2*i*exp(i*x)',

  'circexp(tan(x))',
  'i*exp(-i*x)/(exp(-i*x)+exp(i*x))-i*exp(i*x)/(exp(-i*x)+exp(i*x))',

  'circexp(cosh(x))',
  '1/2*exp(x)+1/2*exp(-x)',

  'circexp(sinh(x))',
  '1/2*exp(x)-1/2*exp(-x)',

  'circexp(tanh(x))',
  '-1/(1+exp(2*x))+exp(2*x)/(1+exp(2*x))',

  'circexp([cos(x),sin(x)])',
  '[1/2*exp(-i*x)+1/2*exp(i*x),1/2*i*exp(-i*x)-1/2*i*exp(i*x)]',

  'circexp(cos(x)*sin(x))-expcos(x)*expsin(x)',
  '0',

  'circexp(i*2^(1/4)*sin(1/8*pi)+2^(1/4)*cos(1/8*pi))',
  '2^(1/4)*exp(1/8*i*pi)',

  'circexp(1)',
  '1',

  'circexp(x)',
  'x',

  'circexp(exp(i*x))',
  'exp(i*x)',

  'circexp(cos(0))',
  '1',

  'circexp(tan(pi/4))',
  '1',

  'circexp(cosh(0))',
  '1',

  // cos(x)^2 = (1+cos(2x))/2
  'circexp(cos(x)^2)',
  '1/2+1/4*exp(-2*i*x)+1/4*exp(2*i*x)',

  'circexp(sin(x)^2+cos(x)^2)',
  '1',

  'circexp(sin(2*x))',
  '1/2*i*exp(-2*i*x)-1/2*i*exp(2*i*x)',

  // sin(x) cos(y) = (sin(x+y)+sin(x-y))/2
  'circexp(sin(x)*cos(y))',
  '1/4*i*exp(-i*x-i*y)+1/4*i*exp(-i*x+i*y)-1/4*i*exp(i*x-i*y)-1/4*i*exp(i*x+i*y)',

  'float(subst(1,x,circexp(tanh(x))))',
  '0.761594...',

  // no trig functions to rewrite
  'circexp(arcsin(x))',
  'arcsin(x)',
]);
