import { run_test } from '../test-harness';

// defint of rational functions of sin, cos and tan. F(b)-F(a) holds only
// for an antiderivative F that is continuous on [a,b]; the ones written
// with tan(x/2) or tan(x) jump at the odd multiples of pi resp. of pi/2.
// defint splits the interval there and adds one-sided limits of F, and it
// stops when the integrand itself has a pole inside.
//
// The number in the comment of each pair is mpmath.quad of the integrand
// (25 digits, the interval split at the jump points). near6 compares with
// it; exact results are compared by subtraction, so that the printed form
// of the radicals does not matter.
const helpers = ['near6(u,v)=abs(float(u)-v)<10^(-6)', ''];

// 1. the reported integrals: jumps of the antiderivative inside (a,b)
run_test([
  ...helpers,

  // 3.62759872847 = 2*pi/sqrt(3)
  'defint(1/(2+cos(x)),x,0,2*pi)-2*pi/sqrt(3)',
  '0',

  'near6(defint(1/(2+cos(x)),x,0,2*pi),3.62759872847)',
  '1',

  // 2.41839915231
  'near6(defint(1/(2+cos(x)),x,pi/2,3*pi/2),2.41839915231)',
  '1',

  // 3.62759872847 = 2*pi/sqrt(3)
  'near6(defint(1/(2+sin(x)),x,0,2*pi),3.62759872847)',
  '1',

  // 1.15600433434
  'near6(defint(1/(5+3*cos(x)),x,0,4),1.15600433434)',
  '1',

  // 2.22144146908 = pi/sqrt(2)
  'near6(defint(1/(1+sin(x)^2),x,0,pi),2.22144146908)',
  '1',

  'defint(1/(1+sin(x)^2),x,0,pi)-pi/sqrt(2)',
  '0',

  // 1.57079632679 = pi/2
  'defint(1/(4*cos(x)^2+sin(x)^2),x,0,pi)',
  '1/2*pi',

  // 1.0471975512 = pi/3
  'defint(1/(1+4*tan(x)^2),x,0,pi)',
  '1/3*pi',

  // -0.972012149757 = 2*pi-4*pi/sqrt(3)
  'near6(defint(cos(x)/(2+cos(x)),x,0,2*pi),-0.972012149757)',
  '1',

  // 0.706056836896
  'near6(defint(sin(x)^2/(2+cos(x)^2),x,0,pi),0.706056836896)',
  '1',

  // 2.41839915231 = 4*pi/(3*sqrt(3))
  'near6(defint(1/(2+cos(x))^2,x,0,2*pi),2.41839915231)',
  '1',

  // 70.5960795355, 32 jumps
  'near6(defint(1/(1+sin(x)^2),x,0,100),70.5960795355)',
  '1',
]);

// 2. neighbours: other coefficients, variables, arguments and intervals
run_test([
  ...helpers,

  // 2.09439510239 = 2*pi/3
  'defint(1/(5-4*cos(x)),x,0,2*pi)',
  '2/3*pi',

  // 1.57079632679 = pi/2
  'defint(1/(5+3*cos(x)),x,0,2*pi)',
  '1/2*pi',

  // 2.80992589242 = 2*pi/sqrt(5), another variable
  'near6(defint(1/(3-2*sin(t)),t,0,2*pi),2.80992589242)',
  '1',

  // 1.81379936423 = pi/sqrt(3), tan(x) from cos(2*x)
  'near6(defint(1/(2+cos(2*x)),x,0,pi),1.81379936423)',
  '1',

  // 5.17551020652, the jump of tan(x/4) at 2*pi
  'near6(defint(1/(2+cos(x/2)),x,0,8),5.17551020652)',
  '1',

  // 0.816708928014, jumps at pi/3 and pi
  'near6(defint(1/(5+4*sin(3*x)),x,0,3),0.816708928014)',
  '1',

  // 3.61233086121
  'near6(defint(1/(1+cos(x)^2),x,0,5),3.61233086121)',
  '1',

  // 2.54323336006
  'near6(defint(1/(3+sin(x)+cos(x)),x,0,7),2.54323336006)',
  '1',

  // 14.2228980608, 6 jumps
  'near6(defint(1/(1+sin(x)^2),x,0,20),14.2228980608)',
  '1',

  // 4.16156030306, jumps at -pi/2 and pi/2
  'near6(defint(1/(1+sin(x)^2),x,-3,3),4.16156030306)',
  '1',

  // 7.25519745694 = 4*pi/sqrt(3), two jumps
  'defint(1/(2+cos(x)),x,0,4*pi)-4*pi/sqrt(3)',
  '0',

  // 8.57589122381, jumps at -pi, pi and 3*pi
  'near6(defint(1/(2+cos(x)),x,-4,10),8.57589122381)',
  '1',

  // 3.52073711519
  'near6(defint(1/(2+cos(x)),x,1,7),3.52073711519)',
  '1',

  // 3.53278138587, float bounds
  'near6(defint(1/(2+cos(x)),x,0.0,6.0),3.53278138587)',
  '1',
]);

// 3. reversed limits and a jump exactly at a bound
run_test([
  ...helpers,

  // -3.62759872847
  'defint(1/(2+cos(x)),x,2*pi,0)+2*pi/sqrt(3)',
  '0',

  // -8.57589122381
  'near6(defint(1/(2+cos(x)),x,10,-4),-8.57589122381)',
  '1',

  // -2.22144146908
  'near6(defint(1/(1+sin(x)^2),x,pi,0),-2.22144146908)',
  '1',

  // 1.81379936423 = pi/sqrt(3): the jump is at the upper bound
  'defint(1/(2+cos(x)),x,0,pi)-pi/sqrt(3)',
  '0',

  // 1.81379936423: the jump is at the lower bound
  'defint(1/(2+cos(x)),x,pi,2*pi)-pi/sqrt(3)',
  '0',

  // 3.62759872847: at both bounds
  'defint(1/(2+cos(x)),x,-pi,pi)-2*pi/sqrt(3)',
  '0',

  // 1.81380671064: the jump at pi is 7*10^(-6) inside the bound, it counts
  'near6(defint(1/(2+cos(x)),x,0,3.1416),1.81380671064)',
  '1',

  // 1.11072073454 = pi/(2*sqrt(2))
  'near6(defint(1/(1+sin(x)^2),x,0,pi/2),1.11072073454)',
  '1',

  // 1.20919957616 = 2*pi/(3*sqrt(3)), a term of the antiderivative is
  // tan/(3+tan^2) with tan = inf at the bound
  'near6(defint(1/(2+cos(x))^2,x,0,pi),1.20919957616)',
  '1',
]);

// 4. a pole of the integrand inside the interval: the integral diverges
run_test([
  // 1+cos(x) = 0 at pi
  'defint(1/(1+cos(x)),x,0,4)',
  'Stop: defint: the integrand has a pole at x = 3.14159 inside the interval',

  // cos(x) = -1/2 at 2*pi/3 = 2.0943951
  'defint(1/(1+2*cos(x)),x,0,3)',
  'Stop: defint: the integrand has a pole at x = 2.0944 inside the interval',

  // sin(x) = -1/2 at -pi/6 = -0.52359878
  'defint(1/(1+2*sin(x)),x,-1,1)',
  'Stop: defint: the integrand has a pole at x = -0.523599 inside the interval',

  // tan(x) = -1 at 3*pi/4 = 2.3561945
  'defint(1/(1+tan(x)),x,0,3)',
  'Stop: defint: the integrand has a pole at x = 2.35619 inside the interval',

  // tan(x) = -2 at pi-arctan(2) = 2.0344439
  'defint(1/(2+tan(x)),x,0,3)',
  'Stop: defint: the integrand has a pole at x = 2.03444 inside the interval',

  // sin(x)+cos(x) = 0 at 3*pi/4
  'defint(1/(sin(x)+cos(x)),x,0,3)',
  'Stop: defint: the integrand has a pole at x = 2.35619 inside the interval',

  // reversed limits, another variable
  'defint(1/(1+2*cos(t)),t,3,0)',
  'Stop: defint: the integrand has a pole at t = 2.0944 inside the interval',

  // 1-sin(x) = 0 at pi/2, a double zero without a change of sign
  'defint(1/(1-sin(x)),x,0,2)',
  'Stop: defint: the integrand has a pole at x = 1.5708 inside the interval',

  // not only trigonometric: exp(x) = 2 at log(2) = 0.69314718
  'defint(1/(exp(x)-2),x,0,1)',
  'Stop: defint: the integrand has a pole at x = 0.693147 inside the interval',

  // cos(x)^2 = 1/2 at pi/4
  'defint(1/(1-2*cos(x)^2),x,0,1)',
  'Stop: defint: the integrand has a pole at x = 0.785398 inside the interval',

  // these were found before and still are
  'defint(tan(x),x,0,2)',
  'Stop: defint: the integrand has a pole at x = 1.5708 inside the interval',

  'defint(1/cos(x)^2,x,0,2)',
  'Stop: defint: the integrand has a pole at x = 1.5708 inside the interval',
]);

// 5. the same integrands on intervals without a pole
run_test([
  ...helpers,

  // 14.1014199472 = tan(3/2)
  'defint(1/(1+cos(x)),x,0,3)',
  'tan(3/2)',

  // 1.69494674894
  'near6(defint(1/(1+2*cos(x)),x,0,2),1.69494674894)',
  '1',

  // -2.00265237057: between the poles 2*pi/3 and 4*pi/3, tan(x/2) is
  // singular at pi, where the two logs of the antiderivative are inf-inf
  'near6(defint(1/(1+2*cos(x)),x,5/2,4),-2.00265237057)',
  '1',

  // 0.646529652686: tan(x) is singular at pi/2, the integrand is 0 there
  'near6(defint(1/(1+tan(x)),x,0,2),0.646529652686)',
  '1',

  // 0.380389885758
  'near6(defint(1/(2+tan(x)),x,0,19/10),0.380389885758)',
  '1',
]);

// 6. tan = inf at a bound: the antiderivative there is a limit (inf-inf)
run_test([
  ...helpers,

  // 0.489689094606 = (pi-log(2))/5
  'defint(1/(2+tan(x)),x,0,pi/2)-(pi-log(2))/5',
  '0',

  'near6(defint(1/(2+tan(x)),x,0,pi/2),0.489689094606)',
  '1',

  // 0.785398163397 = pi/4
  'defint(1/(1+tan(x)),x,0,pi/2)',
  '1/4*pi',

  // 0.361377669172 = (3*pi/2-log(3))/10
  'near6(defint(1/(3+tan(x)),x,0,pi/2),0.361377669172)',
  '1',

  // -0.489689094606
  'near6(defint(1/(2+tan(t)),t,pi/2,0),-0.489689094606)',
  '1',

  // the limits behind it: log(abs(2*cos(x)+sin(x))) at pi/2 is log(1)
  'limit(log(abs(2+tan(x)))+log(abs(cos(x))),x,pi/2,left)',
  '0',

  'limit(log(abs(2+tan(x)))+log(abs(cos(x))),x,pi/2,right)',
  '0',

  // the same logs with the rational coefficient of the antiderivative and
  // a further term: 2/5*pi/2+log(1)/5 = pi/5 = 0.628318530718 from both sides
  'limit(2/5*x+1/5*log(abs(2+tan(x)))+1/5*log(abs(cos(x))),x,pi/2,left)',
  '1/5*pi',

  'limit(2/5*x+1/5*log(abs(2+tan(x)))+1/5*log(abs(cos(x))),x,pi/2,right)',
  '1/5*pi',

  // pi/4 = 0.785398163397
  'limit(1/2*x+1/2*log(abs(1+tan(x)))+1/2*log(abs(cos(x))),x,pi/2)',
  '1/4*pi',

  // (sqrt(3)*cos-sin)/(sqrt(3)*cos+sin) at x/2 = pi/2 is -1, log(1) = 0
  'limit(log(abs(sqrt(3)-tan(x/2)))-log(abs(sqrt(3)+tan(x/2))),x,pi)',
  '0',

  // sin*cos/(3*cos^2+sin^2) at pi/2
  'limit(tan(x)/(3+tan(x)^2),x,pi/2)',
  '0',

  // tan^2/(1+tan^2) = sin^2
  'limit(tan(x)^2/(1+tan(x)^2),x,pi/2)',
  '1',

  // infinite limits stay infinite
  'limit(tan(x),x,pi/2,left)',
  'inf',

  'limit(tan(x),x,pi/2,right)',
  '-inf',

  'limit(log(x),x,0,right)',
  '-inf',

  'limit(log(x)+1/x,x,0,right)',
  'inf',

  'limit(log(abs(cos(x))),x,pi/2)',
  '-inf',

  'limit(tan(x)^2+log(abs(cos(x))),x,pi/2)',
  'inf',
]);

// 7. nothing to split: these give what they gave before
run_test([
  ...helpers,

  // 0.557407724655 = tan(1)-1, tan in the antiderivative but no jump
  'defint(tan(x)^2,x,0,1)',
  '-1+tan(1)',

  // 1.6726765375
  'near6(defint(1/(2+cos(x)),x,0,3),1.6726765375)',
  '1',

  // tests/defint.ts
  'defint(x^2,x,0,1)',
  '1/3',

  'defint(x^2,x,1,0)',
  '-1/3',

  'defint(x^2,x,a,b)',
  '-1/3*a^3+1/3*b^3',

  'defint(sin(x),x,0,pi)',
  '2',

  'defint(1/(1+x^2),x,0,1)',
  '1/4*pi',

  'defint(sqrt(1-x^2),x,-1,1)',
  '1/2*pi',

  'defint(tan(x),x,0,1)',
  '-log(cos(1))',

  'defint(1/(x^2-1),x,2,3)',
  '-1/2*log(2)+1/2*log(3)',

  'defint(x*y,x,0,1,y,0,2)',
  '1',

  'defint(exp(-x),x,0,inf)',
  '1',

  'defint(1/(1+x^2),x,-inf,inf)',
  'pi',

  'defint(exp(-x^2),x,-inf,inf)',
  'pi^(1/2)',

  'defint(1/x,x,1,inf)',
  'inf',

  'defint(log(x),x,0,1)',
  '-1',

  'defint(1/sqrt(x),x,0,1)',
  '2',

  'defint(1/x^2,x,0,1)',
  'inf',

  'defint(x^(-1/2),x,-1,1)',
  '2-2*i',

  'defint(1/x^2,x,-1,1)',
  'Stop: defint: the integrand has a pole at x = 0 inside the interval',

  'defint(1/(x^2-1),x,0,2)',
  'Stop: defint: the integrand has a pole at x = 1 inside the interval',

  'defint(tan(x),x,0,pi)',
  'Stop: defint: the integrand has a pole at x = 1.5708 inside the interval',

  'defint(1/cos(x),x,0,3)',
  'Stop: defint: the integrand has a pole at x = 1.5708 inside the interval',

  // removable: x+1
  'defint((x^2-1)/(x-1),x,0,2)',
  '4',

  // tests/integral_gaps.ts
  'abs(float(defint(1/(sin(x)+cos(x)),x,0,1))-0.776150000059282)<10^(-9)',
  '1',

  'abs(float(defint(1/(3+5*cos(x)),x,0,1))-0.140132996307221)<10^(-9)',
  '1',

  'abs(float(defint(1/(1+sin(x)+cos(x)),x,0,1))-0.435866590692474)<10^(-9)',
  '1',

  'abs(float(defint(1/cos(x)^4,x,0,1))-2.81658164059915)<10^(-9)',
  '1',

  'abs(float(defint(1/(1+sin(x)^2),x,0,1))-0.809352817335295)<10^(-9)',
  '1',

  'abs(float(defint(sqrt(tan(x)),x,0,1))-0.727298249343511)<10^(-9)',
  '1',

  // tests/integral_heuristic.ts, tests/fourier.ts
  'defint(abs(x-1),x,0,3)',
  '5/2',

  'defint(exp(x)*sin(x),x,0,pi)',
  '1/2+1/2*exp(pi)',

  'defint(x*sin(2*x),x,-pi,pi)',
  '-pi',
]);

// 8. piecewise integrands (tests/piecewise.ts)
run_test([
  'p=piecewise(x^2,x<0,x,x<=2,4)',
  '',

  'defint(p,x,-1,3)',
  '19/3',

  'defint(p,x,3,-1)',
  '-19/3',

  'defint(p,x,1/2,3/2)',
  '1',

  'defint(piecewise(1/x,x>0,0),x,-1,1)',
  'inf',

  'defint(piecewise(1/sqrt(x),x>0,0),x,-1,1)',
  '2',

  'defint(piecewise(0,x<sqrt(2),1),x,0,2)',
  '2-2^(1/2)',

  't=piecewise(x,and(0<=x,x<=1),2-x,and(1<x,x<=2),0)',
  '',

  'defint(t,x,-inf,inf)',
  '1',

  'defint(x^2*t,x,0,2)',
  '7/6',

  // 2.98315531518: the jump at pi inside the first piece, plus 1 for [4,5]
  'abs(float(defint(piecewise(1/(2+cos(x)),x<4,1),x,pi/2,5))-2.98315531518)<10^(-6)',
  '1',
]);

// 9. other symbols in the integrand, many periods
run_test([
  // no numbers to tell a jump from a pole: the limits of the antiderivative
  // decide. 2*pi*a/sqrt(3), at a = 1: 3.62759872847
  'defint(a/(2+cos(x)),x,0,2*pi)-2*pi*a/sqrt(3)',
  '0',

  // 1.81379936423 = pi/sqrt(3), times the integral of y over [0,1]
  'defint(y/(2+cos(x)),x,0,2*pi,y,0,1)-pi/sqrt(3)',
  '0',

  'defint(1/(2+cos(x)),x,0,2*pi,y,0,1)-2*pi/sqrt(3)',
  '0',

  // a*tan(x/2) is infinite at pi
  'defint(a/(1+cos(x)),x,0,4)',
  'Stop: defint: the integrand has a pole at x = 3.14159 inside the interval',

  // 173.509028476 (mpmath.quad over 600 subintervals), 95 jumps
  'abs(float(defint(1/(2+cos(x)),x,0,300))-173.509028476)<10^(-6)',
  '1',

  // 577.130623162 (mpmath.quad over 2000 subintervals), 159 jumps: the
  // antiderivative is a function of tan(x/2) alone, so every jump is the
  // same and is computed once
  'abs(float(defint(1/(2+cos(x)),x,0,1000))-577.130623162)<10^(-6)',
  '1',

  // 3535.50205677, 1591 jumps; a term linear in x beside the tan changes
  // nothing (1/(1+4*tan(x)^2) has -x/3): pi/3*100 = 104.719755120
  'abs(float(defint(1/(1+sin(x)^2),x,0,5000))-3535.50205677)<10^(-5)',
  '1',

  'defint(1/(1+4*tan(x)^2),x,0,100*pi)',
  '100/3*pi',

  // 35.5723906478: two periods, tan(x/2) and tan(x/6), every jump on its own
  'abs(float(defint(1/(2+cos(x))+1/(2+cos(x/3)),x,0,30))-35.5723906478)<10^(-6)',
  '1',

  // and then 212 jumps are over the limit: no result rather than a slow one
  'defint(1/(2+cos(x))+1/(2+cos(x/3)),x,0,1000)',
  'defint(1/(2+cos(x))+1/(2+cos(1/3*x)),x,0,1000)',

  // in float mode every product has the factor 1.0: taking constant factors
  // out of the integrand must not go round in circles (no result here, the
  // condition abs(x)<1/2 is not linear)
  'float(defint(x*piecewise(1/(x^2+1),abs(x)<1/2,2),x,-5/2,7/2))',
  'defint(1.0*x*piecewise(1/(1.0+x^2.0),abs(x)<0.5,2.0),x,-2.5,3.5)',

  // log(x) = 0 at 1, found by the scan
  'defint(1/log(x),x,1/2,2)',
  'Stop: defint: the integrand has a pole at x = 1 inside the interval',

  // 0.507631758499: exp(x) = 2 is outside the interval
  'abs(float(defint(1/(exp(x)-2),x,1,2))-0.507631758499)<10^(-6)',
  '1',
]);

// 10. a symbolic term makes integral() write a complex log, whose branch cut
// is another jump: no result then (the defint is evaluated again once a has
// a value), never a wrong one
run_test([
  'near6(u,v)=abs(float(u)-v)<10^(-6)',
  '',

  // 1.41119117306 = 2*0.705595586530: the cut is crossed at x = 0
  'near6(eval(defint((a+1)/(2+cos(x)),x,-1,1),a,1),1.41119117306)',
  '1',

  // 0.985708659418: not crossed
  'near6(eval(defint((a+1)/(2+cos(x)),x,1,2),a,1),0.985708659418)',
  '1',

  // 7.25519745694: both bounds are on the cut
  'near6(eval(defint((a+1)/(2+cos(x)),x,0,2*pi),a,1),7.25519745694)',
  '1',

  // 9.91078403565 = 2*pi+3.62759872847
  'near6(eval(defint(a/(2+cos(x))+1,x,0,2*pi),a,1),9.91078403565)',
  '1',

  // 3.62759872847, sin(x)/(2+cos(x)) has integral 0 over a period
  'near6(eval(defint((a+sin(x))/(2+cos(x)),x,0,2*pi),a,1),3.62759872847)',
  '1',

  // 3.62759872847 for b = 2 and 2.22144146908 = 2*pi/sqrt(8) for b = 3;
  // divergent for abs(b) < 1, so there is no answer for every b
  'near6(eval(defint(1/(b+cos(x)),x,0,2*pi),b,2),3.62759872847)',
  '1',

  'near6(eval(defint(1/(b+cos(x)),x,0,2*pi),b,3),2.22144146908)',
  '1',

  // 0.183787207891: no singular point of tan(x/2) inside, the formula stays
  'near6(eval(defint(1/(b+cos(x)),x,1/2,1),b,2),0.183787207891)',
  '1',

  // a factor beside it stays in the unevaluated integral
  'defint(a/(b+cos(x)),x,0,2*pi)',
  'defint(a/(b+cos(x)),x,0,2*pi)',

  // an unevaluated piece inside a result: float() used to evaluate it
  // again without end
  'float(defint(piecewise(1/(b+cos(x)),x<7,1),x,0,8))',
  '1.0+defint(1/(b+cos(x)),x,0.0,7.0)',

  // 4.87353490846 = 1+integral of 1/(2+cos(x)) over [0,7]
  'near6(eval(defint(piecewise(1/(b+cos(x)),x<7,1),x,0,8),b,2),4.87353490846)',
  '1',
]);
