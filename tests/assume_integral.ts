import { run_test } from '../test-harness';

// The integral tables pick the form that fits the known sign of a parameter.
// A condition like a>0 in a table entry holds when the assumptions say so,
// fails when they say the opposite and, for a symbol with no assumption,
// still holds as before (the tables then take the generic sign).
// Every result below was checked by differentiating it back and numerically
// with parameter values that satisfy the assumptions.
run_test([
  // without assumptions: unchanged
  'integral(1/(x^2+a),x)',
  'arctan(x/(a^(1/2)))/(a^(1/2))',

  'integral(1/sqrt(a-x^2),x)',
  'arcsin(x/(a^(1/2)))',

  'integral(1/x,x)',
  'log(x)',

  'integral(1/(x^2+a*x+b),x)',
  '2*arctan(2*x/((4*b-a^2)^(1/2))+a/((4*b-a^2)^(1/2)))/((4*b-a^2)^(1/2))',

  'integral(sqrt(a*x^2+b),x)',
  'Stop: integral: sorry, could not find a solution',

  // a > 0
  'assume(a>0)',
  '',

  'integral(1/(x^2+a),x)',
  'arctan(x/(a^(1/2)))/(a^(1/2))',

  // x^2-a with a > 0: log form
  'integral(1/(x^2-a),x)',
  'log(-a/(-a^(1/2)*x-a)+a^(1/2)*x/(-a^(1/2)*x-a))/(2*a^(1/2))',

  'integral(1/sqrt(a-x^2),x)',
  'arcsin(x/(a^(1/2)))',

  'integral(sqrt(a*x^2+b),x)',
  '1/2*x*(a*x^2+b)^(1/2)+b*log((a*x^2+b)^(1/2)+a^(1/2)*x)/(2*a^(1/2))',

  // a < 0: log form instead of arctan, no arcsin of an imaginary argument
  'forget(a)',
  '',

  'assume(a<0)',
  '',

  'integral(1/(x^2+a),x)',
  'log(a/(-(-a)^(1/2)*x+a)+x*(-a)^(1/2)/(-(-a)^(1/2)*x+a))/(2*(-a)^(1/2))',

  'integral(1/(x^2-a),x)',
  'arctan(x/((-a)^(1/2)))/((-a)^(1/2))',

  // a-x^2 < 0: 1/sqrt(a-x^2) = -i/sqrt(x^2-a)
  'integral(1/sqrt(a-x^2),x)',
  '-i*log(x+(x^2-a)^(1/2))',

  'integral(1/x*1/sqrt(a+b*x),x)',
  '2*arctan((-b*x/a-1)^(1/2))/((-a)^(1/2))',

  'integral(sqrt(a*x^2+b),x)',
  'b*arcsin((-a/b)^(1/2)*x)/(2*(-a)^(1/2))+1/2*x*(a*x^2+b)^(1/2)',

  'forget()',
  '',

  // 1/(a*x^2+b) by the sign of a*b
  'assume(a>0)',
  '',

  'assume(b>0)',
  '',

  'integral(1/(a*x^2+b),x)',
  'arctan(a^(1/2)*x/(b^(1/2)))/(a^(1/2)*b^(1/2))',

  'forget(b)',
  '',

  'assume(b<0)',
  '',

  'integral(1/(a*x^2+b),x)',
  'log(b/(-(-a*b)^(1/2)*x+b)+x*(-a*b)^(1/2)/(-(-a*b)^(1/2)*x+b))/(2*(-a*b)^(1/2))',

  // x^2+a*x+b with b<0: 4*b-a^2 < 0 for any real a, log form
  'forget(a)',
  '',

  'ispositive(-a^2)',
  '0',

  'isnegative(4*b-a^2)',
  '1',

  'integral(1/(x^2+a*x+b),x)',
  'log(a/(2*x+a+(-4*b+a^2)^(1/2))+2*x/(2*x+a+(-4*b+a^2)^(1/2))-(-4*b+a^2)^(1/2)/(2*x+a+(-4*b+a^2)^(1/2)))/((-4*b+a^2)^(1/2))',

  'integral(x/(x^2+a*x+b),x)',
  '-a*log(a/(2*x+a+(-4*b+a^2)^(1/2))+2*x/(2*x+a+(-4*b+a^2)^(1/2))-(-4*b+a^2)^(1/2)/(2*x+a+(-4*b+a^2)^(1/2)))/(2*(-4*b+a^2)^(1/2))+1/2*log(x^2+a*x+b)',

  'forget()',
  '',

  // 1/x: log(-x) for x < 0
  'assume(x<0)',
  '',

  'integral(1/x,x)',
  'log(-x)',

  'integral(3/x,x)',
  '3*log(-x)',

  'integral(sqrt(x^2),x)',
  '-1/2*x^2',

  'forget(x)',
  '',

  'assume(x>0)',
  '',

  'integral(1/x,x)',
  'log(x)',

  'integral(sqrt(x^2),x)',
  '1/2*x^2',

  'integral(abs(x),x)',
  '1/2*x^2',

  'integral(sqrt(4*x^2),x)',
  'x^2',
]);
