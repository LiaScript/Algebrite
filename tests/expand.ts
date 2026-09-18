import { run_test } from '../test-harness';

run_test([
  // general cases

  'expand(1/(x+1)/(x+2))',
  '1/(x+1)-1/(x+2)',

  'expand((2x^3-x+2)/(x^2-2x+1))',
  '4+2*x+5/(x-1)+3/(x^2-2*x+1)',

  'expand(1/x^2/(x-1))',
  '-1/(x^2)-1/x+1/(x-1)',

  'p=5s+2',
  '',

  'q=(s+1)*(s+2)^2',
  '',

  'expand(p/q)',
  '-3/(s+1)+3/(s+2)+8/(s^2+4*s+4)',

  // ensure denominators are expanded (result seems preferable that way)

  'q=(x-1)*(x-2)^3',
  '',

  'expand(1/q)',
  '1/(x^3-6*x^2+12*x-8)+1/(x-2)-1/(x-1)-1/(x^2-4*x+4)',

  // fractional poles

  'expand(1/(x+1/2)/(x+1/3))',
  '-12/(2*x+1)+18/(3*x+1)',

  // expand tensor

  'f=1/(x+1)/(x+2)',
  '',

  'g=1/(x+1)-1/(x+2)',
  '',

  'expand([[f,f],[f,f]])-[[g,g],[g,g]]',
  '[[0,0],[0,0]]',

  // denominator normalized?

  'expand(1/(1+1/x))',
  '1-1/(x+1)',

  // poles at zero

  'expand(1/x/(x+1))',
  '1/x-1/(x+1)',

  'expand(1/x^2/(x+1))',
  //"x^(-2)-1/x+1/(x+1)",
  '1/x^2-1/x+1/(x+1)',

  // other corner cases

  'expand(1/x)',
  '1/x',

  'expand(1/x^2)',
  //"x^(-2)",
  '1/x^2',

  'expand(1/(x^2-4x+4))',
  '1/(x^2-4*x+4)',

  // cases where nothing can be done

  'expand(sin(x))',
  'sin(x)',

  'expand(x)',
  'x',

  'expand(1/sin(x))',
  // unclear why the extra parens are added but no biggie
  '1/(sin(x))',

  // note that expand isn't needed to execute the
  // multiplications, expand does something
  // different.
  'expand(expand((sin(x)+1)^2))',
  '1+sin(x)^2+2*sin(x)',

  'expand(0)',
  '0',

  'expand((x+1)^2)',
  'x^2+2*x+1',

  'expand((x-y)^3)',
  'x^3-y^3+3*x*y^2-3*x^2*y',

  'expand((a+b+c)^2)',
  '2*a*b+2*a*c+2*b*c+a^2+b^2+c^2',

  'expand((x+1)^10)',
  'x^10+10*x^9+45*x^8+120*x^7+210*x^6+252*x^5+210*x^4+120*x^3+45*x^2+10*x+1',

  'expand((a+b)*(c+d))',
  'a*c+a*d+b*c+b*d',

  'expand(x*(x+1)^2)',
  'x^3+2*x^2+x',

  'expand(2*(x+y)^2-2*x^2-2*y^2)',
  '4*x*y',

  'expand((x+i)*(x-i))',
  'x^2+1',

  'expand((1+i)^3)',
  '-2+2*i',

  'expand((sqrt(2)+1)^2)',
  '3+2*2^(1/2)',

  'expand((x+1.5)^2)',
  'x^2+3.0*x+2.25',

  'expand((x+1)^0)',
  '1',

  'expand((x+1)^(-1))',
  '1/(x+1)',

  'expand((x+1)^(1/2))',
  '(x+1)^(1/2)',

  'expand((x+1)/(x^2-1))',
  '1/(x-1)',

  'expand((x^2+1)/(x+1))',
  '-1+x+2/(x+1)',

  'expand([(x+1)^2,(x-1)^2])',
  '[1+2*x+x^2,1-2*x+x^2]',

  'expand(sin(x)*(1+cos(x)))',
  'sin(x)+cos(x)*sin(x)',

  'expand(exp(x+y))',
  'exp(x+y)',

  // constant factors of a single-term denominator must not be counted twice
  'expand(1/(x*y))',
  '1/(x*y)',

  'expand((1/2)/x)',
  '1/(2*x)',

  'expand((x+1)/(2*x))',
  '1/2+1/(2*x)',

  'expand((x-1)/(x*y))',
  '1/y-1/(x*y)',

  'expand((x-1)/(x*y*z))',
  '-1/(x*y*z)+1/(y*z)',

  'expand((2*i-1/2)/(-x))',
  '1/(2*x)-2*i/x',
]);
