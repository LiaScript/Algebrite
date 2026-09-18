import { run_test } from '../test-harness';

run_test([
  'exp(-3/4*i*pi)',
  //"exp(-3/4*i*pi)",
  '-1/2*2^(1/2)-1/2*i*2^(1/2)',

  'simplify(exp(-3/4*i*pi))',
  //"exp(-3/4*i*pi)",
  //"-1/2*2^(1/2)-1/2*i*2^(1/2)",
  '-(1+i)/(2^(1/2))',

  'exp(0)',
  '1',

  'exp(0.0)',
  '1.0',

  'exp(1)',
  'e',

  'exp(-1)',
  'exp(-1)',

  'exp(log(x))',
  'x',

  'exp(x)*exp(y)',
  'exp(x+y)',

  'exp(x)^2',
  'exp(2*x)',

  'exp(x)*exp(-x)',
  '1',

  'd(exp(x^2),x)',
  '2*x*exp(x^2)',

  // Euler identity and friends
  'exp(i*pi)',
  '-1',

  'exp(2*i*pi)',
  '1',

  'exp(i*pi/2)',
  'i',

  'exp(-i*pi/2)',
  '-i',

  'exp(i*pi/3)',
  '1/2+1/2*i*3^(1/2)',

  'exp(i*pi/4)',
  '1/2*2^(1/2)+1/2*i*2^(1/2)',

  'abs(exp(i*x))',
  '1',

  // floats
  'exp(1.0)',
  '2.718282...',

  'exp(-1.0)',
  '0.367879...',

  'exp(2.0)',
  '7.389056...',

  'float(exp(2))',
  '7.389056...',

  'exp(0.5)',
  '1.648721...',

  // complex float exponents: exp(x+iy) = exp(x)*(cos(y)+i*sin(y))
  'exp(1.0*i)',
  '0.540302...+0.841471...*i',

  'float(exp(i))',
  '0.540302...+0.841471...*i',

  'float(exp(1+i))',
  '1.468694...+2.287355...*i',

  'float(exp(i*pi/3))',
  '0.500000...+0.866025...*i',
]);
