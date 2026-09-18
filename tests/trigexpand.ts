import { run_test } from '../test-harness';

run_test([
  'trigexpand(sin(2x))',
  '2*cos(x)*sin(x)',

  'trigexpand(cos(2x))',
  'cos(x)^2-sin(x)^2',

  'trigexpand(sin(x+y))',
  'cos(x)*sin(y)+cos(y)*sin(x)',

  'trigexpand(cos(x+y))',
  'cos(x)*cos(y)-sin(x)*sin(y)',

  'trigexpand(cos(3x))',
  'cos(x)^3-3*cos(x)*sin(x)^2',

  'trigexpand(sin(-2x))',
  '-2*cos(x)*sin(x)',

  'trigexpand(tan(x+y))',
  'cos(x)*sin(y)/(cos(x)*cos(y)-sin(x)*sin(y))+cos(y)*sin(x)/(cos(x)*cos(y)-sin(x)*sin(y))',

  'trigexpand(sin(x+pi/2))',
  'cos(x)',

  'trigexpand(sin(x))',
  'sin(x)',

  // beyond the cap of 50 the argument is left alone
  'trigexpand(sin(51*x))',
  'sin(51*x)',

  'trigexpand([sin(2x),cos(2x)])',
  '[2*cos(x)*sin(x),cos(x)^2-sin(x)^2]',

  'trigexpand(1+sin(2x))',
  '1+2*cos(x)*sin(x)',

  'simplify(sin(2x)/cos(x))',
  '2*sin(x)',

  'simplify(cos(x)^2-sin(x)^2-cos(2x))',
  '0',

  'simplify(sin(x+y)-sin(x)*cos(y))',
  'cos(x)*sin(y)',

  'trigsimp(sin(2x)/sin(x))',
  '2*cos(x)',

  'trigexpand(0)',
  '0',

  'trigexpand(x)',
  'x',

  'trigexpand(cos(x-y))',
  'cos(x)*cos(y)+sin(x)*sin(y)',

  'trigexpand(sin(x-y))',
  '-cos(x)*sin(y)+cos(y)*sin(x)',

  'trigexpand(sin(3x))',
  '-sin(x)^3+3*cos(x)^2*sin(x)',

  'trigexpand(cos(4x))',
  'cos(x)^4+sin(x)^4-6*cos(x)^2*sin(x)^2',

  'trigexpand(tan(2x))',
  '2*cos(x)*sin(x)/(cos(x)^2-sin(x)^2)',

  'trigexpand(sin(x+y+z))',
  'cos(x)*cos(y)*sin(z)+cos(x)*cos(z)*sin(y)+cos(y)*cos(z)*sin(x)-sin(x)*sin(y)*sin(z)',

  'trigexpand(sin(2x+pi))',
  '-2*cos(x)*sin(x)',

  'trigexpand(sin(2x)*cos(2x))',
  '-2*cos(x)*sin(x)^3+2*cos(x)^3*sin(x)',

  'trigexpand(cos(2x)-cos(x)^2+sin(x)^2)',
  '0',

  // zero up to rounding: float() converts the exact difference
  'abs(float(subst(1/3,x,trigexpand(sin(5x))-sin(5x))))<10^(-12)',
  '1',

  // only integer multiples and sums are expanded
  'trigexpand(sin(1/2*x))',
  'sin(1/2*x)',

  'trigexpand(sin(2.0*x))',
  'sin(2.0*x)',

  'trigexpand(sinh(2x))',
  'sinh(2*x)',

  'trigexpand(sin(x)^2)',
  'sin(x)^2',

  // trigsimp
  'trigsimp(0)',
  '0',

  'trigsimp(x)',
  'x',

  'trigsimp(sin(x)^2+cos(x)^2)',
  '1',

  'trigsimp(1-sin(x)^2)',
  'cos(x)^2',

  'trigsimp(cos(x)^2-sin(x)^2)',
  '-1+2*cos(x)^2',

  'trigsimp(sin(x)^4-cos(x)^4)',
  '1-2*cos(x)^2',

  'trigsimp(tan(x)*cos(x))',
  'sin(x)',

  'trigsimp(1/cos(x)^2-tan(x)^2)',
  '1',

  'trigsimp(sin(x+y)-sin(x)*cos(y)-cos(x)*sin(y))',
  '0',

  'trigsimp([sin(x)^2+cos(x)^2,1])',
  '[1,1]',
]);
