import { run_test } from '../test-harness';

run_test([
  'nroots(x)',
  '0',

  // x^2 = -1/(1+i) = (-1+i)/2, so x = +-2^(-1/4)*exp(3/8*i*pi)
  // = +-(0.321797+0.776887*i)
  'nroots((1+i)*x^2+1)',
  '[-0.321797...-0.776887...*i,0.321797...+0.776887...*i]',

  'nroots(sqrt(2)*exp(i*pi/4)*x^2+1)',
  '[-0.321797...-0.776887...*i,0.321797...+0.776887...*i]',

  // Roots are irrational on purpose: the iteration starts at random
  // values and may hit an integer root exactly, printed 2.0 not 2.000000...
  // Conjugate pairs with equal real parts are left out as well: their
  // order depends on those random start values.

  // complex leading coefficient: x = 2^(1/2)/i
  'nroots(i*x-sqrt(2))',
  '-1.414214...*i',

  'nroots(1.5*x-2)',
  '1.333333...',

  'nroots(x^2-2)',
  '[-1.414214...,1.414214...]',

  // (3+-5^(1/2))/2
  'nroots(x^2-3*x+1,x)',
  '[0.381966...,2.618034...]',

  'nroots(y^2-5,y)',
  '[-2.236068...,2.236068...]',

  'nroots(x^2+2)',
  '[-1.414214...*i,1.414214...*i]',

  // 2*cos(2/9*pi), 2*cos(4/9*pi), 2*cos(8/9*pi)
  'nroots(x^3-3*x+1)',
  '[-1.879385...,0.347296...,1.532089...]',

  'nroots(5)',
  'Stop: nroots: polynomial?',

  'nroots(0)',
  'Stop: nroots: polynomial?',

  'nroots(sin(x))',
  'Stop: nroots: polynomial?',

  'nroots(x^2+1/x)',
  'Stop: nroots: polynomial?',

  'nroots(a*x^2+1)',
  'Stop: nroots: coefficients?',
]);
