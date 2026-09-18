import { run_test } from '../test-harness';

// Fourier series
//   fouriercoeff(f,x,k)      [a_k, b_k] on [-pi,pi]
//   fouriercoeff(f,x,k,L)    on [-L,L] (half period L)
//   fouriercoeff(f,x,k,[a,b]) on [a,b] (period b-a, half period L=(b-a)/2)
//     a_k = 1/L integral f cos(k pi x/L),  b_k = 1/L integral f sin(k pi x/L)
//   fourierseries(f,x,n[,L or [a,b]]) = a_0/2 + sum_{k=1..n} a_k cos(k pi x/L) + b_k sin(k pi x/L)
//
// Fourier transform, convention without 1/sqrt(2 pi):
//   fourier(f,x,w)    = integral_{-inf}^{inf} f(x) exp(-i w x) dx
//   invfourier(F,w,x) = 1/(2 pi) integral_{-inf}^{inf} F(w) exp(i w x) dw
//
// All coefficients and transforms below were checked with mpmath quad.

// ---------------------------------------------------------- coefficients
run_test([
  // x is odd: a_k = 0, b_k = 2 (-1)^(k+1)/k
  'fouriercoeff(x,x,1)',
  '[0,2]',

  'fouriercoeff(x,x,2)',
  '[0,-1]',

  'fouriercoeff(x,x,3)',
  '[0,2/3]',

  // a_0 = 1/pi integral x^2 = 2 pi^2/3, a_k = 4 (-1)^k/k^2
  'fouriercoeff(x^2,x,0)',
  '[2/3*pi^2,0]',

  'fouriercoeff(x^2,x,1)',
  '[-4,0]',

  'fouriercoeff(x^2,x,2)',
  '[1,0]',

  // abs(x): a_0 = pi, a_k = 2((-1)^k-1)/(pi k^2)
  'fouriercoeff(abs(x),x,0)',
  '[pi,0]',

  'fouriercoeff(abs(x),x,1)',
  '[-4/pi,0]',

  'fouriercoeff(abs(x),x,2)',
  '[0,0]',

  'fouriercoeff(abs(x),x,3)',
  '[-4/(9*pi),0]',

  // square wave: b_k = 2(1-(-1)^k)/(pi k)
  'fouriercoeff(sgn(x),x,1)',
  '[0,4/pi]',

  'fouriercoeff(sgn(x),x,2)',
  '[0,0]',

  'fouriercoeff(sgn(x),x,3)',
  '[0,4/(3*pi)]',

  'fouriercoeff(heaviside(x),x,0)',
  '[1,0]',

  'fouriercoeff(heaviside(x),x,1)',
  '[0,2/pi]',

  // exp(x): a_k = 2(-1)^k sinh(pi)/(pi(1+k^2)), b_k = -k a_k
  // a_1 = -3.67607791037, b_1 = 3.67607791037, a_2 = 1.47043116415, b_2 = -2.9408623283
  'abs(float(fouriercoeff(exp(x),x,1))-[-3.67607791037,3.67607791037]) < 10^(-9)',
  '1',

  'abs(float(fouriercoeff(exp(x),x,2))-[1.47043116415,-2.9408623283]) < 10^(-9)',
  '1',

  'fouriercoeff(exp(x),x,2)-[1,-2]*(exp(pi)-exp(-pi))/(5*pi)',
  '[0,0]',

  // cos(x/2): a_k = 4 (-1)^(k+1)/(pi (4k^2-1)); integral() alone cannot do
  // the product cos(x/2)*cos(k*x)
  'fouriercoeff(cos(x/2),x,0)',
  '[4/pi,0]',

  'fouriercoeff(cos(x/2),x,1)',
  '[4/(3*pi),0]',

  'fouriercoeff(cos(x/2),x,2)',
  '[-4/(15*pi),0]',

  // trigonometric polynomials reproduce themselves
  'fouriercoeff(sin(x)^2,x,0)',
  '[1,0]',

  'fouriercoeff(sin(x)^2,x,1)',
  '[0,0]',

  'fouriercoeff(sin(x)^2,x,2)',
  '[-1/2,0]',

  'fouriercoeff(sin(x)^2,x,3)',
  '[0,0]',

  // x cos(x): b_1 = -1/2, b_2 = 4/3, b_3 = -3/4
  'fouriercoeff(x*cos(x),x,1)',
  '[0,-1/2]',

  'fouriercoeff(x*cos(x),x,2)',
  '[0,4/3]',

  // x sin(x): a_0 = 2, a_1 = -1/2, a_2 = -2/3
  'fouriercoeff(x*sin(x),x,0)',
  '[2,0]',

  'fouriercoeff(x*sin(x),x,1)',
  '[-1/2,0]',

  'fouriercoeff(x*sin(x),x,2)',
  '[-2/3,0]',

  // x abs(x): b_1 = 2 pi - 8/pi, b_2 = -pi
  'fouriercoeff(x*abs(x),x,1)',
  '[0,2*pi-8/pi]',

  'fouriercoeff(x*abs(x),x,2)',
  '[0,-pi]',
]);

// ------------------------------------------------- break points of abs/sgn
run_test([
  // break point at 1: a_0 = (pi^2+1)/pi
  'fouriercoeff(abs(x-1),x,0)',
  '[1/pi+pi,0]',

  'abs(float(fouriercoeff(abs(x-1),x,1))-[-0.980586903339,-1.17231683917]) < 10^(-9)',
  '1',

  'abs(float(fouriercoeff(abs(x-1),x,2))-[0.22538676918,0.173590705964]) < 10^(-9)',
  '1',

  // break point outside of [-pi,pi]: abs(x+5) = x+5 there
  'fouriercoeff(abs(x+5),x,0)',
  '[10,0]',

  'fouriercoeff(abs(x+5),x,1)',
  '[0,2]',

  // heaviside(x-1): a_0 = (pi-1)/pi, a_1 = -sin(1)/pi, b_1 = (1+cos(1))/pi
  'fouriercoeff(heaviside(x-1),x,0)',
  '[1-1/pi,0]',

  'fouriercoeff(heaviside(x-1),x,1)-[-sin(1)/pi,(1+cos(1))/pi]',
  '[0,0]',

  // rectified sine: a_0 = 4/pi, a_2 = -4/(3 pi), a_4 = -4/(15 pi), odd a_k = 0
  'fouriercoeff(abs(sin(x)),x,0)',
  '[4/pi,0]',

  'fouriercoeff(abs(sin(x)),x,1)',
  '[0,0]',

  'fouriercoeff(abs(sin(x)),x,2)',
  '[-4/(3*pi),0]',

  'fouriercoeff(abs(sin(x)),x,4)',
  '[-4/(15*pi),0]',
]);

// ------------------------------------------------------- symbolic index k
run_test([
  // without an assumption k is any real number: the general formula
  'fouriercoeff(x,x,k)',
  '[0,2*sin(k*pi)/(k^2*pi)-2*cos(k*pi)/k]',

  'assume(k,integer)',
  '',

  // valid for every integer, so the evaluator does it
  '1/(-1)^k',
  '(-1)^k',

  '(-1)^(-k-1)',
  '(-1)^(1+k)',

  'fouriercoeff(x,x,k)',
  '[0,-2*(-1)^k/k]',

  'fouriercoeff(x^2,x,k)',
  '[4*(-1)^k/(k^2),0]',

  'fouriercoeff(abs(x),x,k)',
  '[2*(-1)^k/(k^2*pi)-2/(k^2*pi),0]',

  'fouriercoeff(sgn(x),x,k)',
  '[0,-2*(-1)^k/(k*pi)+2/(k*pi)]',

  // a_k = 2(-1)^k sinh(pi)/(pi(1+k^2)) at k = 3: checked against the numeric index
  'simplify(subst(3,k,fouriercoeff(exp(x),x,k))-fouriercoeff(exp(x),x,3))',
  '[0,0]',

  'fouriercoeff(x,x,k,1)',
  '[0,-2*(-1)^k/(k*pi)]',

  // sawtooth on [0,1]: b_k = -1/(k pi)
  'fouriercoeff(x,x,k,[0,1])',
  '[0,-1/(k*pi)]',

  'forget(k)',
  '',
]);

// ------------------------------------------------------------ partial sums
run_test([
  'fourierseries(x,x,3)',
  '2*sin(x)-sin(2*x)+2/3*sin(3*x)',

  'fourierseries(x,x,1)',
  '2*sin(x)',

  'fourierseries(x,x,0)',
  '0',

  'fourierseries(x^2,x,0)',
  '1/3*pi^2',

  'fourierseries(x^2,x,3)',
  '-4*cos(x)+cos(2*x)-4/9*cos(3*x)+1/3*pi^2',

  'fourierseries(abs(x),x,3)',
  '-4*cos(x)/pi-4*cos(3*x)/(9*pi)+1/2*pi',

  'fourierseries(sgn(x),x,4)',
  '4*sin(x)/pi+4*sin(3*x)/(3*pi)',

  'fourierseries(heaviside(x),x,3)',
  '1/2+2*sin(x)/pi+2*sin(3*x)/(3*pi)',

  // a constant is its own series
  'fourierseries(5,x,3)',
  '5',

  // trigonometric polynomials reproduce themselves once n is large enough
  'fourierseries(sin(x)^2,x,2)',
  '1/2-1/2*cos(2*x)',

  'fourierseries(sin(x)^2,x,5)',
  '1/2-1/2*cos(2*x)',

  'fourierseries(sin(x)^2,x,1)',
  '1/2',

  'fourierseries(3*sin(2*x)-cos(x),x,3)',
  '-cos(x)+3*sin(2*x)',

  'fourierseries(cos(x)^3,x,3)',
  '3/4*cos(x)+1/4*cos(3*x)',

  'fourierseries(cos(x/2),x,2)',
  '4*cos(x)/(3*pi)-4*cos(2*x)/(15*pi)+2/pi',

  'fourierseries(abs(sin(x)),x,4)',
  '-4*cos(2*x)/(3*pi)-4*cos(4*x)/(15*pi)+2/pi',

  // a_0/2 = sinh(pi)/pi = 3.67607791037; at x = 0.5 the sum to n = 2 is
  // 3.676 - 3.676 cos(.5) + 3.676 sin(.5) + 1.4704 cos(1) - 2.9409 sin(1) = 0.5322487
  'abs(float(subst(1/2,x,fourierseries(exp(x),x,2)))-0.532248701244) < 10^(-9)',
  '1',

  // another variable
  'fourierseries(t,t,2)',
  '2*sin(t)-sin(2*t)',

  'fourierseries(t*y,t,2)',
  '2*y*sin(t)-y*sin(2*t)',
]);

// ------------------------------------------------------------ other periods
run_test([
  // half period L = 1: b_k = 2(-1)^(k+1)/(k pi)
  'fourierseries(x,x,2,1)',
  '2*sin(pi*x)/pi-sin(2*pi*x)/pi',

  // L = 2: a_0/2 = 4/3, a_k = 16(-1)^k/(k^2 pi^2)
  'fourierseries(x^2,x,2,2)',
  '4/3-16*cos(1/2*pi*x)/(pi^2)+4*cos(pi*x)/(pi^2)',

  'fourierseries(abs(x),x,3,1)',
  '1/2-4*cos(pi*x)/(pi^2)-4*cos(3*pi*x)/(9*pi^2)',

  // L = pi given explicitly
  'fourierseries(x,x,2,pi)',
  '2*sin(x)-sin(2*x)',

  // an interval: the sawtooth x on [0,1], period 1
  'fourierseries(x,x,2,[0,1])',
  '1/2-sin(2*pi*x)/pi-sin(4*pi*x)/(2*pi)',

  'fourierseries(x,x,2,[0,2*pi])',
  '-2*sin(x)-sin(2*x)+pi',

  // x^2 on [0,2 pi]: a_0/2 = 4 pi^2/3, a_k = 4/k^2, b_k = -4 pi/k
  'fourierseries(x^2,x,2,[0,2*pi])',
  '4*cos(x)+cos(2*x)-4*pi*sin(x)-2*pi*sin(2*x)+4/3*pi^2',

  'fourierseries(x,x,2,[-pi,pi])',
  '2*sin(x)-sin(2*x)',

  // exp(-x) on [0,1]: a_0 = 2(1-1/e), a_1 = a_0/(1+4 pi^2), b_1 = 2 pi a_1
  'abs(float(fouriercoeff(exp(-x),x,1,[0,1]))-[0.031232473809,0.196239420543]) < 10^(-9)',
  '1',

  'fouriercoeff(exp(-x),x,0,[0,1])',
  '[2-2*exp(-1),0]',

  // symbolic half period
  'fourierseries(x,x,2,L)',
  '2*L*sin(pi*x/L)/pi-L*sin(2*pi*x/L)/pi',

  // abs needs to know that 0 lies inside of [-L,L]
  'fouriercoeff(abs(x),x,1,L)',
  'fouriercoeff(abs(x),x,1,L)',

  'assume(L,positive)',
  '',

  'fouriercoeff(abs(x),x,1,L)',
  '[-4*L/(pi^2),0]',

  'forget(L)',
  '',
]);

// ------------------------------------------- what stays as it is, and misuse
run_test([
  'fouriercoeff(f(x),x,1)',
  'fouriercoeff(f(x),x,1)',

  'fourierseries(f(x),x,2)',
  'fourierseries(f(x),x,2)',

  // no closed form of the integrals
  'fourierseries(exp(x^3),x,2)',
  'fourierseries(exp(x^3),x,2)',

  // a symbolic number of terms
  'fourierseries(x,x,n)',
  'fourierseries(x,x,n)',

  'fourierseries(x,x,-1)',
  'Stop: fourierseries: the number of terms must be a nonnegative integer',

  'fourierseries(x,x,3/2)',
  'Stop: fourierseries: the number of terms must be a nonnegative integer',

  'fourierseries(x,x,2,[1,1])',
  'Stop: fourierseries: the period must not be zero',

  // soft builtins: a user definition wins
  'fourierseries(u,v)=u+v',
  '',

  'fourierseries(1,2)',
  '3',

  'fourier=7',
  '',

  'fourier+1',
  '8',
]);

// ------------------------------------------------------ transform: table
run_test([
  'fourier(dirac(x),x,w)',
  '1',

  // default variables x and w
  'fourier(dirac(x))',
  '1',

  'fourier(dirac(x-2),x,w)',
  'exp(-2*i*w)',

  'fourier(dirac(x+c),x,w)',
  'exp(i*c*w)',

  'fourier(dirac(2*x),x,w)',
  '1/2',

  'fourier(dirac(-2*x+6),x,w)',
  '1/2*exp(-3*i*w)',

  'fourier(1,x,w)',
  '2*pi*dirac(w)',

  'fourier(3,x,w)',
  '6*pi*dirac(w)',

  'fourier(c,x,w)',
  '2*c*pi*dirac(w)',

  'fourier(0,x,w)',
  '0',

  // Gaussian: sqrt(pi/a) exp(-w^2/(4a))
  'fourier(exp(-x^2),x,w)',
  'pi^(1/2)*exp(-1/4*w^2)',

  'fourier(exp(-2*x^2),x,w)',
  '2^(1/2)*pi^(1/2)*exp(-1/8*w^2)/2',

  'fourier(exp(-t^2/2),t,u)',
  '2^(1/2)*pi^(1/2)*exp(-1/2*u^2)',

  'fourier(5*exp(-x^2),x,w)',
  '5*pi^(1/2)*exp(-1/4*w^2)',

  // two sided exponential: 2a/(a^2+w^2)
  'fourier(exp(-abs(x)),x,w)',
  '2/(w^2+1)',

  'fourier(exp(-3*abs(x)),x,w)',
  '6/(w^2+9)',

  'fourier(exp(-abs(2*x)),x,w)',
  '4/(w^2+4)',

  // Lorentzian: pi/a exp(-a abs(w))
  'fourier(1/(x^2+1),x,w)',
  'pi*exp(-abs(w))',

  'fourier(1/(x^2+4),x,w)',
  '1/2*pi*exp(-2*abs(w))',

  'fourier(1/(4*x^2+1),x,w)',
  '1/2*pi*exp(-1/2*abs(w))',

  // completed square (x+1)^2+4: shifted by -1
  'fourier(1/(x^2+2*x+5),x,w)',
  '1/2*pi*exp(i*w-2*abs(w))',

  // causal decay: 1/(a+i w)
  'fourier(heaviside(x)*exp(-x),x,w)',
  '1/(1+i*w)',

  'fourier(heaviside(x)*exp(-2*x),x,w)',
  '1/(2+i*w)',

  'fourier(heaviside(x)*x*exp(-x),x,w)',
  '1/((1+i*w)^2)',

  // anticausal
  'fourier(heaviside(-x)*exp(x),x,w)',
  '1/(1-i*w)',

  'fourier(sgn(x),x,w)',
  '-2*i/w',

  'fourier(heaviside(x),x,w)',
  '-i/w+pi*dirac(w)',

  // principal value: 1/x <-> -i pi sgn(w)
  'fourier(1/x,x,w)',
  '-i*pi*sgn(w)',

  'fourier(1/(x-2),x,w)',
  '-i*pi*exp(-2*i*w)*sgn(w)',
]);

// --------------------------------------------- rectangular pulses, defint
run_test([
  'fourier(heaviside(x+1)-heaviside(x-1),x,w)',
  '2*sin(w)/w',

  'fourier(heaviside(x+2)-heaviside(x-2),x,w)',
  '2*sin(2*w)/w',

  // (1-exp(-i w))/(i w)
  'fourier(heaviside(x)-heaviside(x-1),x,w)',
  '-i/w+i*cos(w)/w+sin(w)/w',

  // triangle (1-abs(x)) on [-1,1]: 2(1-cos(w))/w^2
  'fourier((1-abs(x))*(heaviside(x+1)-heaviside(x-1)),x,w)',
  '2/(w^2)-2*cos(w)/(w^2)',

  // one period of the sine: 2 i sin(pi w)/(w^2-1)
  'simplify(fourier(sin(x)*(heaviside(x+pi)-heaviside(x-pi)),x,w)-2*i*sin(pi*w)/(w^2-1))',
  '0',

  'abs(float(subst(1.3,w,fourier(sin(x)*(heaviside(x+pi)-heaviside(x-pi)),x,w)))+2.344976795*i) < 10^(-6)',
  '1',
]);

// ------------------------------------------------------- transform: rules
run_test([
  // linearity
  'fourier(2*exp(-x^2)+3*dirac(x),x,w)',
  '3+2*pi^(1/2)*exp(-1/4*w^2)',

  'fourier(a*exp(-abs(x))+b,x,w)',
  '2*a/(w^2+1)+2*b*pi*dirac(w)',

  // x^n f(x) -> i^n d^n F/dw^n
  'fourier(x*exp(-x^2),x,w)',
  '-1/2*i*pi^(1/2)*w*exp(-1/4*w^2)',

  'fourier(x^2*exp(-x^2),x,w)',
  '1/2*pi^(1/2)*exp(-1/4*w^2)-1/4*pi^(1/2)*w^2*exp(-1/4*w^2)',

  'fourier(x/(x^2+1),x,w)',
  '-i*pi*exp(-abs(w))*sgn(w)',

  'fourier(x,x,w)',
  '2*i*pi*d(dirac(w),w)',

  'fourier(x^2,x,w)',
  '-2*pi*d(d(dirac(w),w),w)',

  'fourier(x*f(x),x,w)',
  'i*d(fourier(f(x),x,w),w)',

  // shift f(x-c) -> exp(-i c w) F(w)
  'fourier(exp(-(x-1)^2),x,w)',
  'pi^(1/2)*exp(-1/4*w^2-i*w)',

  'fourier(exp(-abs(x-2)),x,w)',
  '2*exp(-2*i*w)/(w^2+1)',

  'fourier(heaviside(x-1)*exp(-x),x,w)-exp(-1-i*w)/(1+i*w)',
  '0',

  // modulation exp(i c x) f(x) -> F(w-c)
  'fourier(exp(3*i*x)*exp(-x^2),x,w)',
  'pi^(1/2)*exp(-1/4*w^2+3/2*w-9/4)',

  'fourier(exp(2*i*x),x,w)',
  '2*pi*dirac(w-2)',

  'fourier(exp(2*i*x)*exp(-abs(x)),x,w)',
  '2/(w^2-4*w+5)',

  'fourier(cos(2*x),x,w)',
  'pi*dirac(w-2)+pi*dirac(w+2)',

  'fourier(sin(2*x),x,w)',
  '-i*pi*dirac(w-2)+i*pi*dirac(w+2)',

  'fourier(cos(c*x),x,w)',
  'pi*dirac(c-w)+pi*dirac(c+w)',

  // 1/((w-3)^2+1) + 1/((w+3)^2+1)
  'fourier(cos(3*x)*exp(-abs(x)),x,w)',
  '1/(w^2-6*w+10)+1/(w^2+6*w+10)',

  'fourier(heaviside(x)*exp(-x)*sin(2*x),x,w)-2/((1+i*w)^2+4)',
  '0',

  // derivative rule
  'fourier(d(f(x),x),x,w)',
  'i*w*fourier(f(x),x,w)',

  'fourier(d(f(x),x,2),x,w)',
  '-w^2*fourier(f(x),x,w)',
]);

// ------------------------------------------------------ assumptions decide
run_test([
  // a of unknown sign: no branch is picked
  'fourier(exp(-a*x^2),x,w)',
  'fourier(exp(-a*x^2),x,w)',

  'fourier(exp(-a*abs(x)),x,w)',
  'fourier(exp(-a*abs(x)),x,w)',

  'fourier(1/(x^2+a^2),x,w)',
  'fourier(1/(a^2+x^2),x,w)',

  'fourier(heaviside(x)*exp(-a*x),x,w)',
  'fourier(1/2*exp(-a*x)+1/2*exp(-a*x)*sgn(x),x,w)',

  'fourier(sgn(a*x),x,w)',
  'fourier(sgn(a*x),x,w)',

  'assume(a,positive)',
  '',

  'fourier(exp(-a*x^2),x,w)',
  'pi^(1/2)*exp(-w^2/(4*a))/(a^(1/2))',

  'fourier(exp(-a*abs(x)),x,w)',
  '2*a/(a^2+w^2)',

  'fourier(1/(x^2+a^2),x,w)',
  'pi*exp(-a*abs(w))/a',

  'fourier(heaviside(x)*exp(-a*x),x,w)',
  '1/(a+i*w)',

  'fourier(dirac(a*x),x,w)',
  '1/a',

  // growing instead of decaying
  'fourier(exp(a*x^2),x,w)',
  'fourier(exp(a*x^2),x,w)',

  'fourier(exp(a*abs(x)),x,w)',
  'fourier(exp(a*abs(x)),x,w)',

  'forget(a)',
  '',

  'assume(b,negative)',
  '',

  'fourier(exp(b*x^2),x,w)',
  'pi^(1/2)*exp(w^2/(4*b))/((-b)^(1/2))',

  'forget(b)',
  '',
]);

// ------------------------------------------------------ stays unevaluated
run_test([
  'fourier(f(x),x,w)',
  'fourier(f(x),x,w)',

  'fourier(tan(x),x,w)',
  'fourier(tan(x),x,w)',

  'fourier(2*tan(x),x,w)',
  '2*fourier(tan(x),x,w)',

  'fourier(tan(x)+dirac(x),x,w)',
  '1+fourier(tan(x),x,w)',

  // not integrable
  'fourier(exp(x),x,w)',
  'fourier(exp(x),x,w)',

  'fourier(exp(x^2),x,w)',
  'fourier(exp(x^2),x,w)',

  'fourier(heaviside(x)*exp(x),x,w)',
  'fourier(1/2*exp(x)+1/2*exp(x)*sgn(x),x,w)',

  'fourier(exp(-x^4),x,w)',
  'fourier(exp(-x^4),x,w)',

  'invfourier(g(w),w,x)',
  'invfourier(g(w),w,x)',

  'invfourier(tan(w),w,x)',
  'invfourier(tan(w),w,x)',
]);

// ----------------------------------------------------------- round trips
run_test([
  'invfourier(1,w,x)',
  'dirac(x)',

  'invfourier(1)',
  'dirac(x)',

  'invfourier(fourier(dirac(x-2),x,w),w,x)',
  'dirac(x-2)',

  'invfourier(2*pi*dirac(w),w,x)',
  '1',

  'invfourier(fourier(exp(-x^2),x,w),w,x)',
  'exp(-x^2)',

  'invfourier(fourier(exp(-2*x^2),x,w),w,x)',
  'exp(-2*x^2)',

  'invfourier(fourier(exp(-(x-1)^2),x,w),w,x)',
  'exp(-x^2+2*x-1)',

  'invfourier(fourier(exp(-abs(x)),x,w),w,x)',
  'exp(-abs(x))',

  'invfourier(fourier(exp(-3*abs(x)),x,w),w,x)',
  'exp(-3*abs(x))',

  'invfourier(fourier(1/(x^2+4),x,w),w,x)',
  '1/(x^2+4)',

  'invfourier(fourier(heaviside(x)*exp(-x),x,w),w,x)-heaviside(x)*exp(-x)',
  '0',

  'invfourier(fourier(heaviside(x)*x*exp(-x),x,w),w,x)-heaviside(x)*x*exp(-x)',
  '0',

  'invfourier(fourier(sgn(x),x,w),w,x)',
  'sgn(x)',

  'invfourier(fourier(heaviside(x),x,w),w,x)',
  '1/2+1/2*sgn(x)',

  'invfourier(fourier(heaviside(x+1)-heaviside(x-1),x,w),w,x)',
  '-1/2*sgn(x-1)+1/2*sgn(x+1)',

  'invfourier(fourier(x*exp(-x^2),x,w),w,x)',
  'x*exp(-x^2)',

  'invfourier(fourier(cos(2*x),x,w),w,x)',
  'cos(2*x)',

  'invfourier(fourier(sin(2*x),x,w),w,x)',
  'sin(2*x)',

  'invfourier(fourier(exp(2*i*x),x,w),w,x)',
  'exp(2*i*x)',

  'invfourier(fourier(1/x,x,w),w,x)',
  '1/x',

  'assume(a,positive)',
  '',

  'invfourier(fourier(exp(-a*x^2),x,w),w,x)',
  'exp(-a*x^2)',

  'invfourier(fourier(exp(-a*abs(x)),x,w),w,x)',
  'exp(-a*abs(x))',

  'invfourier(fourier(1/(x^2+a^2),x,w),w,x)',
  '1/(a^2+x^2)',

  'invfourier(fourier(heaviside(x)*exp(-a*x),x,w),w,x)-heaviside(x)*exp(-a*x)',
  '0',

  'forget(a)',
  '',

  // other variable names
  'invfourier(fourier(exp(-t^2),t,s),s,t)',
  'exp(-t^2)',
]);

// ------------------------------- numerically against mpmath quad, two w each
run_test([
  'F=fourier(exp(-2*x^2),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-1.014647592) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-1.178852317) < 10^(-6)',
  '1',

  'F=fourier(exp(-3*abs(x)),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-0.561272217) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-0.6322444679) < 10^(-6)',
  '1',

  'F=fourier(1/(x^2+4),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-0.1166686638) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-0.3873536052) < 10^(-6)',
  '1',

  'F=fourier(heaviside(x)*exp(-2*x),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-(0.3514938489-0.2284710018*i)) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-(0.4454342984+0.1559020045*i)) < 10^(-6)',
  '1',

  'F=fourier(heaviside(x+1)-heaviside(x-1),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-1.482397208) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-1.840621964) < 10^(-6)',
  '1',

  'F=fourier(heaviside(x)-heaviside(x-1),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-(0.7411986042-0.5634624395*i)) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-(0.9203109818+0.3359397325*i)) < 10^(-6)',
  '1',

  'F=fourier(x*exp(-x^2),x,w)',
  '',
  'abs(float(subst(1.3,w,F))+0.7550902706*i) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-0.5488351358*i) < 10^(-6)',
  '1',

  'F=fourier(x^2*exp(-x^2),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-0.0900299938) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-0.5919578965) < 10^(-6)',
  '1',

  'F=fourier((1-abs(x))*(heaviside(x+1)-heaviside(x-1)),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-0.8668652916) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-0.959827807) < 10^(-6)',
  '1',

  'F=fourier(cos(3*x)*exp(-abs(x)),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-0.308377772) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-0.2270560313) < 10^(-6)',
  '1',

  'F=fourier(exp(-(x-1)^2),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-(0.3107473275-1.119343709*i)) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-(1.199349331+1.010198005*i)) < 10^(-6)',
  '1',

  'F=fourier(heaviside(x)*x*exp(-x),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-(-0.09535523279-0.3593095728*i)) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-(0.229719382+0.6306022251*i)) < 10^(-6)',
  '1',

  'F=fourier(heaviside(x)*exp(-x)*sin(2*x),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-(0.3736714062-0.2935183251*i)) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-(0.4044824911+0.1255599751*i)) < 10^(-6)',
  '1',

  'F=fourier(exp(-abs(x-2)),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-(-0.6370920099-0.3832723954*i)) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-(0.228143816+1.322751315*i)) < 10^(-6)',
  '1',

  'F=fourier(1/(x^2+2*x+5),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-(0.03120873091+0.112417046*i)) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-(0.2962643786-0.2495400437*i)) < 10^(-6)',
  '1',

  'F=fourier(exp(3*i*x)*exp(-x^2),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-0.8605917396) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-0.05783650912) < 10^(-6)',
  '1',

  'F=fourier(abs(x)*exp(-abs(x)),x,w)',
  '',
  'abs(float(subst(1.3,w,F))+0.1907104656) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-0.459438764) < 10^(-6)',
  '1',

  'F=fourier(heaviside(x-1)*exp(-x),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-(-0.1347241269-0.1793318819*i)) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-(0.07749906477+0.2912437881*i)) < 10^(-6)',
  '1',

  'F=fourier(exp(-x^2+x),x,w)',
  '',
  'abs(float(subst(1.3,w,F))-(1.187457087-0.9027101011*i)) < 10^(-6)',
  '1',
  'abs(float(subst(-0.7,w,F))-(1.891408878+0.690418136*i)) < 10^(-6)',
  '1',
]);

// ------------------------------------------ neighbours keep their behaviour
run_test([
  'laplace(exp(-t)*t^2)',
  '2/((s+1)^3)',

  'invlaplace(1/(s^2+1))',
  'sin(t)',

  'defint(x*sin(2*x),x,-pi,pi)',
  '-pi',

  'heaviside(x)',
  '1/2+1/2*sgn(x)',

  // (-1)^k without an assumption stays
  '1/(-1)^k',
  '1/((-1)^k)',

  '(-1)^(-3)',
  '-1',
]);
