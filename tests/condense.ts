import { run_test } from '../test-harness';

run_test([
  'condense(a/(a+b)+b/(a+b))',
  '1',

  'psi(n) = exp(-r/n) laguerre(n-1,1,2r/n)',
  '',

  'psi(3)',
  '3*exp(-1/3*r)-2*r*exp(-1/3*r)+2/9*r^2*exp(-1/3*r)',

  'condense(last)',
  'exp(-1/3*r)*(3-2*r+2/9*r^2)',

  'psi()=psi',
  '',

  // test case H

  'condense(-3 exp(-1/3 r + i phi) cos(theta) - 6 exp(-1/3 r + i phi) cos(theta) sin(theta)^2 + 12 exp(-1/3 r + i phi) cos(theta)^3)',
  '3*exp(-1/3*r+i*phi)*(-1+4*cos(theta)^2-2*sin(theta)^2)*cos(theta)',

  'condense(7208+2736*5^(1/2))',
  '8*(901+342*5^(1/2))',

  'condense(0)',
  '0',

  'condense(x)',
  'x',

  'condense(a*b+a*c)',
  'a*(b+c)',

  'condense(2*x+4*y)',
  '2*(x+2*y)',

  'condense(6*x+9)',
  '3*(2*x+3)',

  'condense(1/2*x+1/2*y)',
  '1/2*(x+y)',

  'condense(a*x^2+a*x)',
  'a*x*(x+1)',

  'condense(x^2*y+x*y^2)',
  'x*y*(x+y)',

  // the same product; the display step for polynomials in x no longer
  // rewrites a product that has a sum in it as (coefficient)*x
  'condense(x/y+x/z)',
  'x*(1/y+1/z)',

  // gcd 1.0 must not leave a 1.0*(...) product (arg() recursed on it forever)
  'condense(1.0+1.0*i)',
  '1.0+1.0*i',

  'numerator(1.0+1.0*i)',
  '1.0+1.0*i',
]);
