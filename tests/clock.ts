import { run_test } from '../test-harness';

run_test([
  'clock(exp(i pi/3))',
  '(-1)^(1/3)',

  'clock(exp(-i pi/3))',
  //"-(-1)^(2/3)",
  '1/(-1)^(1/3)',

  'rect(clock(3+4*i))', // needs sin(arctan(x)) and cos(arctan(x))
  '3+4*i',

  'clock((-108+108*(-1)^(1/2)*3^(1/2))^(1/3))',
  '6*(-1)^(2/9)',

  // TODO
  // the changes to abs/mag of Jan 2017
  // make it so a ends up as absolute value
  //     (-1)^(1/5)*abs(a)
  // Rather, clock should somehow recognize
  // that this is already very close to clock
  // form and just replace the exponential with
  // the power of -1
  // Note that this was working before the Jan 2017
  // changes because abs/mag were blissfully
  // transforming abs(any_variable) -> any_variable
  //"clock(exp(1/5*i*pi)*a)",
  //"(-1)^(1/5)*a",

  // real numbers stay as they are (clock(3) used to be 3*(-1)^0)
  'clock(3)',
  '3',

  'clock(-3)',
  '-3',

  'clock(0)',
  '0',

  'clock(2.0)',
  '2.0',

  'clock(exp(i*pi))',
  '-1',

  'clock(i)',
  'i',

  'clock(-i)',
  '1/(-1)^(1/2)',

  'clock(1+i)',
  '(-1)^(1/4)*2^(1/2)',

  'clock(-1-i)',
  '2^(1/2)/((-1)^(3/4))',

  'clock(1.0+1.0*i)',
  '1.414214...*(-1)^0.25',

  'clock(exp(i*x))',
  '(-1)^(x/pi)',

  // tensors are mapped elementwise (clock([1,i]) used to be the norm 2^(1/2) times (-1)^0)
  'clock([1+i,-2])',
  '[(-1)^(1/4)*2^(1/2),-2]',
]);
