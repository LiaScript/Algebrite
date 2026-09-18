import { run_test } from '../test-harness';

run_test([
  // hyperbolic: cosh^2 - sinh^2 = 1
  'simplify(cosh(x)^2-sinh(x)^2)',
  '1',

  'simplify(sinh(x)^2-cosh(x)^2)',
  '-1',

  'simplify(1+sinh(x)^2)',
  'cosh(x)^2',

  'simplify(cosh(x)^2-1)',
  'sinh(x)^2',

  'simplify(cosh(2*x)^2-sinh(2*x)^2)',
  '1',

  'simplify(a*cosh(x)^2-a*sinh(x)^2)',
  'a',

  'simplify(sinh(x)/cosh(x))',
  'tanh(x)',

  // cosh^2 = 1+sinh^2 leaves a single function
  'simplify(cosh(x)^2+sinh(x)^2)',
  '1+2*sinh(x)^2',

  // exp(k*log(m)) = m^k holds for every k and m, so it is done on evaluation
  'exp(2*log(x))',
  'x^2',

  'exp(log(2)+log(3))',
  '6',

  'exp(x+log(y))',
  'exp(x)*y',

  'exp(-log(x))',
  '1/x',

  'exp(1/2*log(x))',
  'x^(1/2)',

  'exp(a*log(x))',
  'x^a',

  'exp(log(x)*log(y))',
  'exp(log(x)*log(y))',

  'simplify(exp(2*log(x)))',
  'x^2',

  'integral(exp(2*log(x)),x)',
  '1/3*x^3',

  'd(exp(3*log(x)),x)',
  '3*x^2',

  // log of a perfect power: log(8) = 3*log(2)
  'simplify(log(8)/log(2))',
  '3',

  'simplify(log(9)/log(3))',
  '2',

  'simplify(log(1/8)/log(2))',
  '-3',

  'simplify(log(4)-2*log(2))',
  '0',

  // log(12)-log(3) = log(4)
  'simplify(log(12)-log(3))',
  '2*log(2)',

  // splitting log(6) would only make it longer
  'simplify(log(6)/log(2))',
  'log(6)/log(2)',

  'simplify(log(x))',
  'log(x)',

  'solve(3^x=81,x)',
  '4',

  // exact values at multiples of pi/12 (15 degrees):
  // sin = (6^(1/2)-2^(1/2))/4, cos = (6^(1/2)+2^(1/2))/4, tan = 2-3^(1/2)
  'float(sin(pi/12))',
  '0.258819...',

  'float(cos(pi/12))',
  '0.965926...',

  'sin(pi/12)',
  '-1/4*2^(1/2)+1/4*2^(1/2)*3^(1/2)',

  'cos(pi/12)',
  '1/4*2^(1/2)+1/4*2^(1/2)*3^(1/2)',

  'tan(pi/12)',
  '2-3^(1/2)',

  'tan(5*pi/12)',
  '2+3^(1/2)',

  'sin(5*pi/12)-cos(pi/12)',
  '0',

  'sin(11*pi/12)-sin(pi/12)',
  '0',

  'cos(7*pi/12)+sin(pi/12)',
  '0',

  'sin(-pi/12)+sin(pi/12)',
  '0',

  'sin(13*pi/12)+sin(pi/12)',
  '0',

  // sin(15)*cos(15) = sin(30)/2
  'simplify(sin(pi/12)*cos(pi/12))',
  '1/4',

  'simplify(sin(pi/12)^2+cos(pi/12)^2)',
  '1',

  // inverse functions know these values
  'arcsin(sin(pi/12))',
  '1/12*pi',

  'arcsin(sin(5*pi/12))',
  '5/12*pi',

  'arcsin(-sin(pi/12))',
  '-1/12*pi',

  'arccos(cos(pi/12))',
  '1/12*pi',

  'arccos(cos(5*pi/12))',
  '5/12*pi',

  // cos(105) = -sin(15)
  'arccos(cos(7*pi/12))',
  '7/12*pi',

  'arctan(tan(pi/12))',
  '1/12*pi',

  'arctan(2-sqrt(3))',
  '1/12*pi',

  'arctan(-2-sqrt(3))',
  '-5/12*pi',

  'solve(sin(x)=sin(pi/12),x)',
  '[1/12*pi,11/12*pi]',

  // multiples of pi/10 would need nested radicals, which make roots of
  // unity and arg() unreadable: left as they are
  'cos(pi/5)',
  'cos(1/5*pi)',

  'sin(pi/10)',
  'sin(1/10*pi)',

  // angles without a simple closed form stay
  'sin(pi/7)',
  'sin(1/7*pi)',

  // tan rewrites
  'simplify(1/(1+tan(x)^2))',
  'cos(x)^2',

  'simplify(sin(x)/cos(x))',
  'tan(x)',

  'simplify(sin(x)^2/cos(x)^2)',
  'tan(x)^2',

  'simplify(tan(x)*cos(x))',
  'sin(x)',

  'simplify(tan(x)-sin(x)/cos(x))',
  '0',

  // half-integer powers of a sum: p^(3/2) = p*p^(1/2) lets terms cancel
  'simplify((x^2+1)^(3/2)-x^2*(x^2+1)^(1/2)-(x^2+1)^(1/2))',
  '0',

  'simplify(7*(49+x^2)^(5/2)-1/7*(49+x^2)^(7/2)+1/7*x^2*(49+x^2)^(5/2))',
  '0',

  'simplify((x+1)^(3/2)/(x+1)^(1/2))',
  'x+1',

  // nothing to gain: stays compact
  'simplify((x^2+1)^(3/2))',
  '(x^2+1)^(3/2)',

  // integral table: (a+b*x)^(3/2) instead of the expanded cube under a root
  'integral(sqrt(x^2+1)*x,x)',
  '1/3*(x^2+1)^(3/2)',

  'integral(sqrt(x+1),x)',
  '2/3*(x+1)^(3/2)',

  'simplify(d(integral(x*sqrt(x+1),x),x)-x*sqrt(x+1))',
  '0',

  // 2/3*(4^(3/2)-1)
  'defint(sqrt(x+1),x,0,3)',
  '14/3',
]);
