import { run_test } from '../test-harness';

run_test([
  // Lambert W: W(x)*exp(W(x)) = x. W(1) = 0.5671432904, W(10) = 1.7455280027
  'lambertw(0)',
  '0',

  'lambertw(exp(1))',
  '1',

  'lambertw(-exp(-1))',
  '-1',

  // log(2)*exp(log(2)) = 2*log(2)
  'lambertw(2*log(2))',
  'log(2)',

  'lambertw(x)',
  'lambertw(x)',

  'float(lambertw(1))',
  '0.567143...',

  'float(lambertw(10))',
  '1.745528...',

  // W*exp(W) gives the argument back
  'abs(float(lambertw(3)*exp(lambertw(3)))-3)<10^(-12)',
  '1',

  'd(lambertw(x),x)',
  // W/(x*(1+W))
  'lambertw(x)/(x+x*lambertw(x))',

  // x*exp(x) = c
  'solve(x*exp(x)=1,x)',
  'lambertw(1)',

  'solve(x*exp(x)=exp(1),x)',
  '1',

  // 3*x*exp(3*x) = 15/2
  'solve(2*x*exp(3*x)=5,x)',
  '1/3*lambertw(15/2)',

  'float(solve(x*exp(x)=1,x))',
  '0.567143...',

  // x^x = c: x = exp(W(log(c))), and W(2*log(2)) = log(2)
  'solve(x^x=4,x)',
  '2',

  'solve(x^x=27,x)',
  '3',

  // x*log(x) = c: x = exp(W(c))
  'solve(x*log(x)=2*log(2),x)',
  '2',

  // sine, cosine and exponential integrals. Si(1) = 0.9460830704,
  // Si(10) = 1.6583475942, Si(30) = 1.5667565400, Ci(1) = 0.3374039229,
  // Ci(10) = -0.0454564330, Ei(1) = 1.8951178164, Ei(-1) = -0.2193839344,
  // Ei(10) = 2492.2289762418
  'Si(0)',
  '0',

  'Si(-x)',
  '-Si(x)',

  'float(Si(1))',
  '0.946083...',

  'float(Si(10))',
  '1.658348...',

  'float(Si(30))',
  '1.566757...',

  'float(Si(-1))',
  '-0.946083...',

  'float(Ci(1))',
  '0.337404...',

  'float(Ci(10))',
  '-0.045456...',

  'float(Ei(1))',
  '1.895118...',

  'float(Ei(-1))',
  '-0.219384...',

  'float(Ei(10))',
  '2492.228976...',

  'd(Si(x),x)',
  'sin(x)/x',

  'd(Ci(x),x)',
  'cos(x)/x',

  'd(Ei(x),x)',
  'exp(x)/x',

  'd(Ei(x^2),x)',
  '2*exp(x^2)/x',

  'integral(sin(x)/x,x)',
  'Si(x)',

  'integral(sin(2*x)/x,x)',
  'Si(2*x)',

  'integral(3*sin(x)/x,x)',
  '3*Si(x)',

  'integral(cos(x)/x,x)',
  'Ci(x)',

  'integral(exp(x)/x,x)',
  'Ei(x)',

  'integral(exp(-x)/x,x)',
  'Ei(-x)',

  'integral(1/log(x),x)',
  'Ei(log(x))',

  'd(integral(sin(x)/x,x),x)',
  'sin(x)/x',

  // the Dirichlet integral
  'defint(sin(x)/x,x,0,inf)',
  '1/2*pi',

  'defint(sin(x)/x,x,-inf,inf)',
  'pi',

  'limit(Si(x),x,inf)',
  '1/2*pi',

  'limit(Ci(x),x,inf)',
  '0',

  'limit(Ei(x),x,-inf)',
  '0',

  // Fresnel integrals, S(x) = integral of sin(pi*t^2/2).
  // S(1) = 0.4382591474, C(1) = 0.7798934004
  'fresnels(0)',
  '0',

  'float(fresnels(1))',
  '0.438259...',

  'float(fresnelc(1))',
  '0.779893...',

  'float(fresnels(-1))',
  '-0.438259...',

  'd(fresnels(x),x)',
  'sin(1/2*pi*x^2)',

  'd(fresnelc(x),x)',
  'cos(1/2*pi*x^2)',

  'limit(fresnels(x),x,inf)',
  '1/2',

  // integral(sin(x^2)) = sqrt(pi/2)*S(sqrt(2/pi)*x), checked by differentiating
  'abs(float(eval(d(integral(sin(x^2),x),x)-sin(x^2),x,7/10)))<10^(-9)',
  '1',

  'abs(float(eval(d(integral(cos(3*x^2),x),x)-cos(3*x^2),x,7/10)))<10^(-9)',
  '1',

  // sqrt(pi/8) = 0.6266570687
  'float(defint(sin(x^2),x,0,inf))',
  '0.626657...',

  // beta(a,b) = Gamma(a)*Gamma(b)/Gamma(a+b)
  'beta(2,3)',
  '1/12',

  'beta(1/2,1/2)',
  'pi',

  'beta(a,b)',
  'Gamma(a)*Gamma(b)/Gamma(a+b)',

  // digamma: psi(1) = -0.5772156649, psi(2) = 0.4227843351
  'float(digamma(1))',
  '-0.577216...',

  'float(digamma(2))',
  '0.422784...',

  'float(digamma(1/2))',
  '-1.963510...',

  'd(Gamma(x),x)',
  'Gamma(x)*digamma(x)',

  // Chebyshev polynomials, in the (x, n) order of hermite and legendre
  'chebyshevt(x,0)',
  '1',

  'chebyshevt(x,1)',
  'x',

  'chebyshevt(x,3)',
  '4*x^3-3*x',

  'chebyshevu(x,2)',
  '4*x^2-1',

  // T_n(cos(t)) = cos(n*t)
  'simplify(chebyshevt(cos(t),2)-cos(2*t))',
  '0',

  'chebyshevt(x,n)',
  'chebyshevt(x,n)',

  // numbers
  'fibonacci(10)',
  '55',

  'fibonacci(0)',
  '0',

  'fibonacci(1)',
  '1',

  'fibonacci(100)',
  '354224848179261915075',

  'fibonacci(n)',
  'fibonacci(n)',

  // 1+1/2+1/3+1/4+1/5
  'harmonic(5)',
  '137/60',

  'harmonic(0)',
  '0',

  'harmonic(1)',
  '1',

  'harmonic(n)',
  'harmonic(n)',

  'totient(10)',
  '4',

  'totient(1)',
  '1',

  'totient(97)',
  '96',

  // 36 = 2^2*3^2: 36*(1/2)*(2/3)
  'totient(36)',
  '12',

  // 1024 = 146*7 + 2
  'powermod(2,10,7)',
  '2',

  // 3^3 = 27 = 1 mod 13, 200 = 3*66 + 2
  'powermod(3,200,13)',
  '9',

  // the inverse: 2*4 = 8 = 1 mod 7
  'powermod(2,-1,7)',
  '4',

  'powermod(2,-1,4)',
  'Stop: powermod: 2 has no inverse modulo 4',

  'nextprime(10)',
  '11',

  'nextprime(13)',
  '17',

  'nextprime(1)',
  '2',

  'primes(20)',
  '[2,3,5,7,11,13,17,19]',

  'primes(1)',
  '[]',

  // 415/93 = 4 + 1/(2 + 1/(6 + 1/7))
  'cfrac(415/93)',
  '[4,2,6,7]',

  'cfrac(7)',
  '[7]',

  'cfrac(float(pi),5)',
  '[3,7,15,1,292]',

  // sqrt(2) = [1; 2, 2, 2, ...]
  'cfrac(sqrt(2),4)',
  '[1,2,2,2]',
]);
