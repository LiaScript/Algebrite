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

  // complex leading coefficient: x = 1/i = -i
  'nroots(i*x-1)',
  '-i',

  'nroots(1.5*x-3)',
  '2.0',

  'nroots(x^2-2)',
  '[-1.414214...,1.414214...]',

  'nroots(x^2-3*x+2,x)',
  '[1.000000...,2.000000...]',

  'nroots(y^2-4,y)',
  '[-2.000000...,2.000000...]',

  'nroots(x^2+1)',
  '[-1.000000...*i,1.000000...*i]',

  // conjugate pairs with equal real parts are left out: their order
  // depends on the random start values of the iteration
  'nroots(x^3-6*x^2+11*x-6)',
  '[1.000000...,2.000000...,3.000000...]',

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
