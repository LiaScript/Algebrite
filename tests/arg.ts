import { run_test } from '../test-harness';

run_test([
  'arg(-1)',
  'pi',

  'arg(pi)',
  '0',

  'arg(1+i)',
  '1/4*pi',

  'arg(1-i)',
  '-1/4*pi',

  'arg(-1+i)',
  '3/4*pi',

  'arg(-1-i)',
  '-3/4*pi',

  'arg((-1)^(1/3))',
  '1/3*pi',

  'arg(1+exp(i*pi/3))',
  '1/6*pi',

  'arg((-1)^(1/6)*exp(i*pi/6))',
  '1/3*pi',
]);

// check when not assuming real variables ----------
run_test([
    'assumeRealVariables = 0',
    '',

    'arg(a)',
    'arg(a)',

    // TODO this is wrong
    //"arg(a*exp(b+i*pi/5))",
    //"1/5*pi",

    'arg(-1)',
    'pi',

    // this is also highly debatable
    // take the example
    // a = -1-i
    // then arg(a) - arg(-a) should give pi
    // but arg(1+i) - arg(-1-i) gives -pi instead
    // "arg(-a)",
    // "-pi+arg(a)",

    'assumeRealVariables = 1',
    '',

]);

run_test([
    'assumeRealVariables = 1',
    '',
    // --------------------------------------------------

    // TODO this is wrong.
    //"arg(a*exp(b+i*pi/5))",
    //"1/5*pi",

    // referencing the test above, if
    // a is positive:
    'arg(abs(a)*exp(b+i*pi/5))',
    '1/5*pi',

    // otherwise, if negative, we get:
    'arg((-8)*exp(b+i*pi/5))',
    '-4/5*pi',

    // if a is positive, zero
    // if a is negative, pi, so
    // we can't say much
    'arg(a)',
    'arg(a)',

    // this is also wrong, this should
    // be either zero or pi
    //"arg(-a)",
    //"-pi+arg(a)",

    'arg(-(-1)^(1/3))',
    '-2/3*pi',

    'arg(-exp(i*pi/3))',
    '-2/3*pi',

    'arg(-i)',
    '-1/2*pi',

    'arg((a+b*i)/(c+d*i))',
    'arg(a+i*b)-arg(c+i*d)',

    'arg(((-1)^(1/2) / (3^(1/2)))^(1/2))',
    '1/4*pi',

    'arg((-1)^(1/6))',
    '1/6*pi',

  // principal value, arg is in (-pi, pi]
  'arg(-1)',
  'pi',

  'arg(-1/2)',
  'pi',

  'arg(-2.0)',
  '3.141593...',

  'arg(1/(-1))',
  'pi',

  'arg(0)',
  '0',

  'arg(1)',
  '0',

  'arg(2.5)',
  '0.0',

  'arg(i)',
  '1/2*pi',

  'arg(-i)',
  '-1/2*pi',

  'arg(3*i)',
  '1/2*pi',

  'arg(-1.0*i)',
  '-1.570796...',

  'arg(1+sqrt(3)*i)',
  '1/3*pi',

  'arg(-1+sqrt(3)*i)',
  '2/3*pi',

  'arg(-1-sqrt(3)*i)',
  '-2/3*pi',

  'arg(3+4*i)',
  'arctan(4/3)',

  'arg(-3-4*i)',
  '-pi+arctan(4/3)',

  // the real part is negative although it does not look negative
  'float(arg(1-sqrt(3)+i))',
  '2.202711...',

  'arg(1/(1+i))',
  '-1/4*pi',

  // floats (this used to recurse forever)
  'arg(1.0+1.0*i)',
  '0.785398...',

  'arg(-1.0-1.0*i)',
  '-2.356194...',

  // exponentials, reduced into (-pi, pi] when the angle is known
  'arg(exp(2*i))',
  '2',

  'arg(exp(4*i))',
  '4-2*pi',

  'arg(exp(7/2*i))',
  '7/2-2*pi',

  'arg(exp(3*i*pi))',
  'pi',

  'arg(exp(-i*pi))',
  'pi',

  'arg((-1)^(5/3))',
  '-1/3*pi',

  'arg((-1)^(8/9))',
  '8/9*pi',

  // cos(a) + i sin(a) forms, a sign in front turns the angle by pi
  'arg(cos(8/9*pi)+i*sin(8/9*pi))',
  '8/9*pi',

  'arg(cos(1/5*pi)-i*sin(1/5*pi))',
  '-1/5*pi',

  'arg(-cos(4/5*pi)-i*sin(4/5*pi))',
  '-1/5*pi',

  'arg(-cos(1/5*pi)+i*sin(1/5*pi))',
  '4/5*pi',

  // tensors are mapped elementwise
  'arg([1,i,-1])',
  '[0,1/2*pi,pi]',
]);

// arg of a product is the sum of the args only up to a multiple of 2*pi,
// and which multiple depends on the values: arg(-y) = pi+arg(y) gave 2*pi
// for y = -3, where arg(-y) = arg(3) = 0. A sum with unknown args in it is
// only returned when it is a single c*arg(u), 0 < c <= 1, with nothing
// added, which stays in (-pi, pi]; everything else stays arg(...).
run_test([
  'arg(-y)',
  'arg(-y)',

  'eval(arg(-y),y,-3)',
  '0',

  'eval(arg(-y),y,3)',
  'pi',

  // -arg(y) would be -pi for y < 0, arg(1/y) is pi
  'arg(1/y)',
  'arg(1/y)',

  'eval(arg(1/y),y,-2)',
  'pi',

  // both negative: arg(x)+arg(y) would be 2*pi
  'arg(x*y)',
  'arg(x*y)',

  'eval(arg(x*y),x,-2,y,-3)',
  '0',

  // a of unknown sign turns the angle by 0 or by pi
  'eval(arg(a*exp(i*pi/5)),a,-2)',
  '-4/5*pi',

  'eval(arg(a*exp(i*pi/5)),a,2)',
  '1/5*pi',

  // still fine: positive factors do not turn, a root halves the angle
  'arg(2*y)',
  'arg(y)',

  'arg(y^(1/2))',
  '1/2*arg(y)',

  'arg(abs(a)*exp(b+i*pi/5))',
  '1/5*pi',

  // with a known sign everything is decided
  'assume(y,negative)',
  '',

  'arg(-y)',
  '0',

  'arg(1/y)',
  'pi',

  'arg(2*y)',
  'pi',

  'forget(y)',
  '',
]);
