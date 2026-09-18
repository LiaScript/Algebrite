import { run_test } from '../test-harness';

// The sign of a real constant and the order of two constants are decided
// with certified digits (two fixed-point evaluations at different
// precisions that must agree, sources/bigfloat.ts), never from one double:
// a decision is right or it is not made. All values below: mpmath, 60 digits.

// ---- 1a. trig arguments beyond 2^53 (the double of the argument is already
// wrong there). sin(3^34) = +0.68532586, cos(3^34) = +0.72823654,
// tan(3^34) = +0.94107590, tan(10^25) = +1.11612597, sin(10^40) = -0.56963340,
// cos(10^40) = -0.82189889, cos(exp(100)) = +0.98983822, sin(10^22) = -0.85220085,
// cos(7*10^16+1) = -0.51994183, sin(2^60) = -0.83064922, sin(10^100) = -0.37237612 (mpmath at 200 digits)
run_test([
  'sgn(sin(3^34))',
  '1',

  'abs(sin(3^34))',
  'sin(16677181699666569)',

  'sqrt(sin(3^34)^2)',
  'sin(16677181699666569)',

  'arg(sin(3^34))',
  '0',

  'isnegative(sin(3^34))',
  '0',

  'ispositive(sin(3^34))',
  '1',

  'isnonzero(sin(3^34))',
  '1',

  // sin(-u) = -sin(u)
  'sgn(sin(-3^34))',
  '-1',

  'sgn(cos(3^34))',
  '1',

  'sgn(tan(3^34))',
  '1',

  'sgn(tan(10^25))',
  '1',

  'sgn(sin(10^40))',
  '-1',

  'abs(sin(10^40))',
  '-sin(10000000000000000000000000000000000000000)',

  'sgn(cos(10^40))',
  '-1',

  'abs(cos(exp(100)))',
  'cos(exp(100))',

  'sgn(sin(10^22))',
  '-1',

  'sgn(cos(7*10^16+1))',
  '-1',

  'sgn(sin(2^60))',
  '-1',

  // needs the last precision step
  'sgn(sin(10^100))',
  '-1',

  // out of reach of 120 digits: undecided, not guessed
  'sgn(sin(10^300))',
  'sgn(sin(1' + '0'.repeat(300) + '))',
]);

// ---- 1b. cancellation between big terms.
// exp(pi*sqrt(163)) = 262537412640768743.99999999999925007...
// cos(1)*10^18 = 540302305868139717.4009366..., cos(1)*10^20 = ...71740.0936...
// 2^(1/2)*10^15 = 1414213562373095.0488...
run_test([
  'sgn(exp(pi*sqrt(163))-262537412640768743)',
  '1',

  'sgn(exp(pi*sqrt(163))-262537412640768744)',
  '-1',

  // the argument is +2.5*10^(-13), so abs gives it back
  'abs(exp(pi*sqrt(163))-262537412640768744+1/10^12)-(exp(pi*sqrt(163))-262537412640768744+1/10^12)',
  '0',

  // the argument is -7.5*10^(-13)
  'abs(exp(pi*sqrt(163))-262537412640768744)+(exp(pi*sqrt(163))-262537412640768744)',
  '0',

  'sgn(cos(1)*10^18-540302305868139720)',
  '-1',

  'sgn(cos(1)*10^18-540302305868139717)',
  '1',

  'sgn(cos(1)*10^18-540302305868139718)',
  '-1',

  'sgn(cos(1)*10^20-54030230586813971739)',
  '1',

  'sgn(cos(1)*10^20-54030230586813971741)',
  '-1',

  'sgn(2^(1/2)*10^15-1414213562373095)',
  '1',

  'sgn(2^(1/2)*10^15-1414213562373096)',
  '-1',

  // 5*10^(-11)
  'sgn(sqrt(10^20+1)-10^10)',
  '1',

  'isnegative(10^10-sqrt(10^20+1))',
  '1',

  // 2^(10^4)*pi-1 = 6.3*10^3010
  'sgn(2^(10^4)*pi-1)',
  '1',

  // exp(pi*sqrt(67))-147197952744 = -1.3*10^(-6)
  'sgn(exp(pi*sqrt(67))-147197952744)',
  '-1',
]);

// ---- 1c. exact zeros in disguise stay undecided; tiny values that are not
// zero are decided now. pi-355/113 = -2.67*10^(-7), pi-103993/33102 =
// +5.8*10^(-10), sin(355/113) = -2.67*10^(-7), sin(11)+1 = +9.8*10^(-6),
// cos(22/7)+1 = +8.0*10^(-7), log(2)-25469/36744 = +6.8*10^(-11),
// exp(pi)-pi-20 = -9.0*10^(-4), tanh(50)-1 = -7.4*10^(-44),
// arctan(10^30)-pi/2 = -10^(-30)
run_test([
  'sgn(2*sin(1)*cos(1)-sin(2))',
  'sgn(-sin(2)+2*cos(1)*sin(1))',

  'isnonzero(2*sin(1)*cos(1)-sin(2))',
  'isnonzero(-sin(2)+2*cos(1)*sin(1))',

  'ispositive(sin(3)-3*sin(1)+4*sin(1)^3)',
  'ispositive(4*sin(1)^3-3*sin(1)+sin(3))',

  'isnegative(cos(2)-2*cos(1)^2+1)',
  'isnegative(1+cos(2)-2*cos(1)^2)',

  'isnonzero(sqrt(2)+sqrt(3)-sqrt(5+2*sqrt(6)))',
  'isnonzero(2^(1/2)+3^(1/2)-(5+2*2^(1/2)*3^(1/2))^(1/2))',

  'sgn(sqrt(2)+sqrt(3)-sqrt(5+2*sqrt(6)))',
  'sgn(2^(1/2)+3^(1/2)-(5+2*2^(1/2)*3^(1/2))^(1/2))',

  // zero plus 10^(-20): positive
  'ispositive(sqrt(2)+sqrt(3)-sqrt(5+2*sqrt(6))+1/10^20)',
  '1',

  'isnegative(sqrt(2)+sqrt(3)-sqrt(5+2*sqrt(6))-1/10^25)',
  '1',

  // zero plus 10^(-300): below the resolution, undecided
  'isnonzero(sqrt(2)+sqrt(3)-sqrt(5+2*sqrt(6))+1/10^300)',
  'isnonzero(1/1' + '0'.repeat(300) + '+2^(1/2)+3^(1/2)-(5+2*2^(1/2)*3^(1/2))^(1/2))',

  'sgn(pi-355/113)',
  '-1',

  'abs(pi-355/113)',
  '355/113-pi',

  'sgn(pi-103993/33102)',
  '1',

  'sgn(sin(355/113))',
  '-1',

  'sgn(sin(11)+1)',
  '1',

  'sgn(cos(22/7)+1)',
  '1',

  'sgn(log(2)-25469/36744)',
  '1',

  'sgn(exp(pi)-pi-20)',
  '-1',

  'sgn(tanh(50)-1)',
  '-1',

  'sgn(arctan(10^30)-pi/2)',
  '-1',
]);

// ---- 1d. what was right stays right, symbols are not touched
run_test([
  'sgn(pi-4)',
  '-1',

  'sgn(log(2)-1)',
  '-1',

  'sgn(cos(2))',
  '-1',

  // 3^(1/3)-2^(1/2) = +0.028
  'sgn(3^(1/3)-2^(1/2))',
  '1',

  // pi^2-987/100 = -0.0004
  'sgn(pi^2-987/100)',
  '-1',

  // floor has no certified evaluation: undecided now (the double said -1)
  'sgn(floor(pi)-4)',
  'sgn(-4+floor(pi))',

  'abs(x+sin(3^34))',
  'abs(x+sin(16677181699666569))',

  'assume(a,negative)',
  '',

  'sgn(a*sin(3^34))',
  '-1',

  'abs(a*sin(3^34))',
  '-a*sin(16677181699666569)',

  'forget(a)',
  '',

  // double precision input is taken as it is: 0.1 is the decimal 0.1
  'sgn(pi-3.14)',
  '1',
]);

// ---- 1e. float of trig functions beyond 2^53: the exact argument is
// reduced with enough digits of pi. 1/cos(3^34) = 1.37318020,
// sin(3^34)+cos(3^34) = 1.41356241
run_test([
  'float(sin(3^34))',
  '0.685326...',

  'float(cos(3^34))',
  '0.728237...',

  'float(tan(3^34))',
  '0.941076...',

  'float(sin(10^40))',
  '-0.569633...',

  'float(tan(10^25))',
  '1.116126...',

  'float(cos(exp(100)))',
  '0.989838...',

  'float(sin(10^22))',
  '-0.852201...',

  'float(1/cos(3^34))',
  '1.373180...',

  'float(sin(3^34)+cos(3^34))',
  '1.413562...',

  'float(x+sin(3^34))',
  'x+0.685326...',

  'float(sin(-3^34))',
  '-0.685326...',

  // small arguments as before: sin(100) = -0.50636564, sin(10^15) = 0.85827279
  'float(sin(100))',
  '-0.506366...',

  'float(sin(10^15))',
  '0.858273...',

  // a double argument is the number it is: 10.0^22 is exact in binary
  'sin(10.0^22)',
  '-0.852201...',

  'float(sin(3^34),20)',
  '0.68532586011981541378',

  // sin(10^2000) = 0.26783674, 2*cos(10^400) = -0.10809994,
  // sin(10^30*2^(1/2)) = -0.91811773 (mpmath at 2200 digits); 10^30*pi is a
  // multiple of 2*pi, sin(1) = 0.84147098
  'float(sin(10^2000))',
  '0.267837...',

  'float(2*cos(10^400)*x)',
  '-0.108100...*x',

  'float(sin(10^30*sqrt(2)))',
  '-0.918118...',

  'float(sin(10^30*pi+1))',
  '0.841471...',

  'float(sec(3^34))',
  '1.373180...',

  'float([sin(3^34),cos(3^34)])',
  '[0.685326...,0.728237...]',

  'f(t)=sin(t)',
  '',

  'float(f(3^34))',
  '0.685326...',

  'float(sin(y))',
  'sin(y)',
]);

// ---- 2a. and/or of bounds that doubles cannot tell apart:
// sqrt(10^20+1)-10^10 = 5*10^(-11), sqrt(10^16+1)-10^8 = 5*10^(-9)
run_test([
  'and(x>10^10,x<sqrt(10^20+1))',
  'and(x>10000000000,x<100000000000000000001^(1/2))',

  'and(x<sqrt(10^16+1),x>10^8)',
  'and(x>100000000,x<10000000000000001^(1/2))',

  'and(x>=10^10,x<=sqrt(10^20+1))',
  'and(x>=10000000000,x<=100000000000000000001^(1/2))',

  'or(x<10^10,x>=sqrt(10^20+1))',
  'or(x<10000000000,x>=100000000000000000001^(1/2))',

  // the other way round: empty, everything
  'and(x<10^10,x>sqrt(10^20+1))',
  '0',

  'or(x>10^10,x<sqrt(10^20+1))',
  '1',

  'and(t>10^10,t<sqrt(10^20+1),t<10^11)',
  'and(t>10000000000,t<100000000000000000001^(1/2))',

  // rational bounds are compared exactly
  'and(x>10^30,x<10^30+1/10^30)',
  'and(x>1000000000000000000000000000000,x<1000000000000000000000000000000000000000000000000000000000001/1000000000000000000000000000000)',

  'and(x>10^30+1/10^30,x<10^30)',
  '0',

  // sin(3^34) > 0, sin(10^40) < 0
  'and(x>0,x<sin(3^34))',
  'and(x>0,x<sin(16677181699666569))',

  'and(x>0,x<sin(10^40))',
  '0',

  // equal bounds that are not proved equal: nothing is joined
  'and(x>=sin(3)+4*sin(1)^3,x<=3*sin(1))',
  'and(x>=4*sin(1)^3+sin(3),x<=3*sin(1))',

  // as before
  'and(x>1,x<2)',
  'and(x>1,x<2)',

  'and(x>2,x<1)',
  '0',

  'and(x>sqrt(2),x<pi)',
  'and(x>2^(1/2),x<pi)',

  'and(x>=1,x<=1)',
  'x==1',

  'or(x<1,x>0)',
  '1',
]);

// ---- 2b. min and max. 10^20+1/3 > 10^20+sqrt(2)/10 (0.333 > 0.141)
run_test([
  'max(sqrt(10^20+1),10^10)',
  '100000000000000000001^(1/2)',

  'min(sqrt(10^20+1),10^10)',
  '10000000000',

  'max(x,sqrt(10^20+1),10^10)',
  'max(x,100000000000000000001^(1/2))',

  'min(x,sqrt(10^20+1),10^10)',
  'min(x,10000000000)',

  'max(10^20+1/3,10^20+sqrt(2)/10)',
  '300000000000000000001/3',

  'min(10^20+1/3,10^20+sqrt(2)/10)',
  '100000000000000000000+1/10*2^(1/2)',

  'max(sin(3^34),0)',
  'sin(16677181699666569)',

  'min(sin(10^40),0)',
  'sin(10000000000000000000000000000000000000000)',

  'max(exp(pi*sqrt(163)),262537412640768744)',
  '262537412640768744',

  // equal, but not proved: both stay
  'max(3*sin(1),sin(3)+4*sin(1)^3)',
  'max(3*sin(1),4*sin(1)^3+sin(3))',

  // 3*sin(1) = 2.52 < 5
  'min(3*sin(1),sin(3)+4*sin(1)^3,5)',
  'min(3*sin(1),4*sin(1)^3+sin(3))',

  'max(3*sin(1),sin(3)+4*sin(1)^3,5)',
  '5',

  // 10^10 < sqrt(10^20+1) < 10^10+1
  'median([sqrt(10^20+1),10^10,10^10+1])',
  '100000000000000000001^(1/2)',

  // as before
  'max(1,2,3)',
  '3',

  'max(sqrt(2),pi/2)',
  '1/2*pi',

  'min(x,1,2)',
  'min(x,1)',

  'max(10^30+1/3,10^30+1/4)',
  '3000000000000000000000000000001/3',

  'max(2,2.5)',
  '2.5',
]);

// ---- 3. comparisons of constants: 1 or 0 with a certified sign, == 1 only
// for a difference that is exactly 0 (also after simplify), otherwise the
// comparison stays
run_test([
  'sqrt(10^20+1)>10^10',
  '1',

  'sqrt(10^20+1)==10^10',
  '0',

  'sqrt(10^20+1)<=10^10',
  '0',

  '10^10<sqrt(10^20+1)',
  '1',

  '2^(1/2)*10^15-1414213562373095>0',
  '1',

  '2^(1/2)*10^15>1414213562373095',
  '1',

  'cos(1)*10^20-54030230586813971739>0',
  '1',

  'cos(1)*10^20-54030230586813971741>0',
  '0',

  'sin(1)^2+cos(1)^2==1',
  '1',

  'sin(1)^2+cos(1)^2>=1',
  '1',

  'sin(1)^2+cos(1)^2>1',
  '0',

  // simplify denests the root: the difference is exactly 1/10^20
  'sqrt(2)+sqrt(3)-sqrt(5+2*sqrt(6))+1/10^20==0',
  '0',

  'sqrt(2)+sqrt(3)-sqrt(5+2*sqrt(6))+1/10^20>0',
  '1',

  'sqrt(2)+sqrt(3)==sqrt(5+2*sqrt(6))',
  '1',

  'sqrt(2)+sqrt(3)>sqrt(5+2*sqrt(6))',
  '0',

  'sin(3^34)>0',
  '1',

  'sin(10^40)>=0',
  '0',

  'exp(pi*sqrt(163))<262537412640768744',
  '1',

  'exp(pi*sqrt(163))==262537412640768744',
  '0',

  // as before
  '2^(1/2)+3^(1/2)>pi',
  '1',

  'pi==pi',
  '1',

  '1/3<0.34',
  '1',

  'x+1>x',
  '1',
]);

// zero, but neither proved nor refuted: the comparison comes back, and
// test, if and piecewise treat it like any undecided condition (a>0)
run_test([
  'sin(3)+4*sin(1)^3>3*sin(1)',
  '4*sin(1)^3+sin(3)>3*sin(1)',

  // 2*sin(1)*cos(1) = sin(2)
  '2*sin(1)*cos(1)-sin(2)>0',
  '2*cos(1)*sin(1)>sin(2)',

  '2*sin(1)*cos(1)==sin(2)',
  '2*cos(1)*sin(1)==sin(2)',

  'test(sin(3)-3*sin(1)+4*sin(1)^3>0,yes,no)',
  'test(sin(3)-3*sin(1)+4*sin(1)^3>0,yes,no)',

  'test(a>0,yes,no)',
  'test(a>0,yes,no)',

  'if(sin(3)-3*sin(1)+4*sin(1)^3>0,yes,no)',
  'if(sin(3)-3*sin(1)+4*sin(1)^3>0,yes,no)',

  'test(sqrt(10^20+1)>10^10,yes,no)',
  'yes',

  'test(sqrt(10^20+1)==10^10,yes,no)',
  'no',

  'if(cos(1)*10^20-54030230586813971739>0,yes,no)',
  'yes',

  'test(sin(1)^2+cos(1)^2==1,yes,no)',
  'yes',

  'piecewise(u,sqrt(10^20+1)<=10^10,v)',
  'v',

  'piecewise(u,sqrt(10^20+1)>10^10,v)',
  'u',

  // a value as condition: nonzero for sure, zero for sure
  'test(sqrt(10^20+1)-10^10,yes,no)',
  'yes',

  'test(sin(1)^2+cos(1)^2-1,yes,no)',
  'no',

  'not(sqrt(10^20+1)>10^10)',
  '0',

  'or(x>1,sin(3)+4*sin(1)^3>3*sin(1))',
  'or(x>1,4*sin(1)^3+sin(3)>3*sin(1))',

  'not(sin(3)+4*sin(1)^3>3*sin(1))',
  '4*sin(1)^3+sin(3)<=3*sin(1)',

  'and(x>1,sqrt(2)>1)',
  'x>1',

  // complex numbers and what has no certified evaluation: as before
  'test(1+i,yes,no)',
  'yes',

  // erf(3) = 0.99997791
  'erf(3)>1/2',
  '1',

  'besselj(1/3,1)>0',
  'besselj(1/3,1)>0',

  // floor of a constant is not evaluated, and has no certified value:
  // undecided (the double said 0, which is right)
  'floor(pi)>3',
  'floor(pi)>3',

  'and(sqrt(10^20+1)>10^10,2^(1/2)*10^15>1414213562373095)',
  '1',
]);

// ---- 4. not/and/or of a comparison with a symbolic coefficient ran into
// "Maximum call stack size exceeded" or "Stop: floating point numbers in
// polynomial": the undecided comparison was evaluated again in floats
run_test([
  'not(b*x<x+y)',
  'b*x>=x+y',

  'and(p,b*x<x+y)',
  'and(p,b*x<x+y)',

  'or(p,b*x<x+y)',
  'or(p,b*x<x+y)',

  'not((a+1)*x<0)',
  '(1+a)*x>=0',

  '(a+1)*x!=0',
  'not((1+a)*x==0)',

  'not(not(b*x<x+y))',
  'b*x<x+y',

  'not(and(b*x<x+y,p))',
  'not(and(b*x<x+y,p))',

  'not(and(b*x<x+y,x>1))',
  'or(b*x>=x+y,x<=1)',

  'test(b*x<x+y,yes,no)',
  'test(b*x<x+y,yes,no)',

  // (b-1)*x >= (b-1)*y with both sides expanded and the negative terms
  // moved over; the sign of b-1 is unknown
  '(b-1)*x>=(b-1)*y',
  'y+b*x>=x+b*y',

  'and(p,(b-1)*x>=(b-1)*y)',
  'and(p,y+b*x>=x+b*y)',

  // c^2 and a^2 may be 0: nothing is divided out
  'and(a^2==a^2*x,c^2*(b-a)*x<c^2*y)',
  'and(a^2==a^2*x,b*c^2*x<a*c^2*x+c^2*y)',
]);

// the same with assumptions. A factor of known sign that is not a common
// factor of the expanded terms (a+1 in a*x+x) is not divided out: the
// comparison stays as it is, which is right for every value.
run_test([
  'assume(a,positive)',
  '',

  'not((a+1)*x<0)',
  '(1+a)*x>=0',

  '(a+1)*x!=0',
  'not((1+a)*x==0)',

  // rhs: (1+a)*u
  'and(q,(a+1)*t<(a+1)*u)',
  'and(q,(1+a)*t<u+a*u)',

  'not(a*x<0)',
  'x>=0',

  'assume(b,negative)',
  '',

  'and(p,(b-1)*x>=(b-1)*y)',
  'and(p,y+b*x>=x+b*y)',

  'not((b-1)*x>=(b-1)*y)',
  'y+b*x<x+b*y',

  'and(p,b*x>=b*y)',
  'and(p,x<=y)',

  'assume(c,nonzero)',
  '',

  'forget(a)',
  '',

  'assume(a,nonzero)',
  '',

  // (b-a)*x < y
  'and(a^2==a^2*x,c^2*(b-a)*x<c^2*y)',
  'and(x==1,b*x<y+a*x)',
]);
