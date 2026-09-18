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
]);
