import { run_test } from '../test-harness';

// Casus irreducibilis: a cubic x^3+b*x^2+c*x+d with real coefficients that
// has three distinct real roots and does not factor. With x = t - b/3 it is
// t^3+p*t+q, and 4*p^3+27*q^2 < 0. Cardano's formula needs cube roots of
// complex numbers there, so the roots are given in trigonometric form:
//
//   theta = arccos(3*q/(2*p)*sqrt(-3/p))/3
//   t = 2*sqrt(-p/3)*cos(theta + 2*pi/3), cos(theta - 2*pi/3), cos(theta)
//
// Order: theta lies in [0, pi/3], which makes the three values above
// ascending. A root list that holds such cosines and consists of real numbers
// only is sorted by ascending numeric value (also together with the roots of
// other factors); with symbolic coefficients the usual term order applies.
// Every expected value below was checked by substitution (mpmath, 30 digits).

run_test([
  // p = -3, q = 1: arccos(-1/2)/3 = 2/9*pi
  // -1.8793852416, 0.3472963553, 1.5320888862
  'solve(x^3-3*x+1,x)',
  '[2*cos(8/9*pi),2*cos(4/9*pi),2*cos(2/9*pi)]',

  'roots(x^3-3*x+1)',
  '[2*cos(8/9*pi),2*cos(4/9*pi),2*cos(2/9*pi)]',

  'roots(x^3-3*x+1,x)',
  '[2*cos(8/9*pi),2*cos(4/9*pi),2*cos(2/9*pi)]',

  // as an equation, other variable name
  'solve(t^3=3*t-1,t)',
  '[2*cos(8/9*pi),2*cos(4/9*pi),2*cos(2/9*pi)]',

  'roots(y^3+1==3*y,y)',
  '[2*cos(8/9*pi),2*cos(4/9*pi),2*cos(2/9*pi)]',

  // a common factor of the coefficients changes nothing
  'roots(2*x^3-6*x+2)',
  '[2*cos(8/9*pi),2*cos(4/9*pi),2*cos(2/9*pi)]',

  'roots(-1/3*x^3+x-1/3)',
  '[2*cos(8/9*pi),2*cos(4/9*pi),2*cos(2/9*pi)]',

  // p = -3, q = -1: arccos(1/2)/3 = 1/9*pi
  // -1.5320888862, -0.3472963553, 1.8793852416
  'roots(x^3-3*x-1)',
  '[2*cos(7/9*pi),2*cos(5/9*pi),2*cos(1/9*pi)]',

  // 4*c^3-3*c = cos(3*t): 8*c^3-6*c+1 = 0 is cos(3*t) = -1/2
  'roots(8*x^3-6*x+1)',
  '[cos(8/9*pi),cos(4/9*pi),cos(2/9*pi)]',

  'roots(8*x^3-6*x-1)',
  '[cos(7/9*pi),cos(5/9*pi),cos(1/9*pi)]',

  // with a quadratic term: (x-1)^3-3*(x-1)+1
  'roots(x^3-3*x^2+3)',
  '[1+2*cos(8/9*pi),1+2*cos(4/9*pi),1+2*cos(2/9*pi)]',

  // (x+1)^3-3*(x+1)-1
  'roots(x^3+3*x^2-3)',
  '[-1+2*cos(7/9*pi),-1+2*cos(5/9*pi),-1+2*cos(1/9*pi)]',
]);

run_test([
  // the numeric self check: real, ascending, and the polynomial vanishes
  'p=x^3-3*x+1',
  '',

  'r=roots(p)',
  '',

  'abs(float(subst(r[1],x,p)))<10^(-9)',
  '1',

  'abs(float(subst(r[2],x,p)))<10^(-9)',
  '1',

  'abs(float(subst(r[3],x,p)))<10^(-9)',
  '1',

  // exactly real, not only up to rounding
  'imag(r[1])',
  '0',

  'imag(r[2])',
  '0',

  'imag(r[3])',
  '0',

  'and(float(r[1])<float(r[2]),float(r[2])<float(r[3]))',
  '1',

  // no rounding leftovers like 1.66*10^(-16)*i
  'float(r)',
  '[-1.879385...,0.347296...,1.532089...]',

  'float(roots(x^3-3*x-1))',
  '[-1.532089...,-0.347296...,1.879385...]',

  // the sum of the roots is -b, the product -d
  'abs(float(r[1]+r[2]+r[3]))<10^(-12)',
  '1',

  'abs(float(r[1]*r[2]*r[3])+1)<10^(-12)',
  '1',
]);

run_test([
  // the arccos is not a known angle: it stays
  // p = -4, q = 1: 2*sqrt(4/3) = 4/3*sqrt(3), arccos argument -3/16*sqrt(3)
  // -2.1149075415, 0.2541016884, 1.8608058531
  'p=x^3-4*x+1',
  '',

  'r=roots(p)',
  '',

  'r[3]',
  '4/3*3^(1/2)*cos(1/3*arccos(-3/16*3^(1/2)))',

  'float(r)',
  '[-2.114908...,0.254102...,1.860806...]',

  'abs(float(subst(r[1],x,p)))<10^(-9)',
  '1',

  'abs(float(subst(r[2],x,p)))<10^(-9)',
  '1',

  'abs(float(subst(r[3],x,p)))<10^(-9)',
  '1',

  'imag(r[1])',
  '0',

  // x^3+x^2-2*x-1 has the roots 2*cos(2/7*pi), 2*cos(4/7*pi), 2*cos(6/7*pi):
  // p = -7/3, q = -7/27, arccos argument 1/14*sqrt(7)
  'p=x^3+x^2-2*x-1',
  '',

  'r=roots(p)',
  '',

  'r[3]',
  '-1/3+2/3*7^(1/2)*cos(1/3*arccos(1/14*7^(1/2)))',

  'float(r)',
  '[-1.801938...,-0.445042...,1.246980...]',

  'abs(float(r[3]-2*cos(2/7*pi)))<10^(-12)',
  '1',

  'abs(float(r[2]-2*cos(4/7*pi)))<10^(-12)',
  '1',

  'abs(float(r[1]-2*cos(6/7*pi)))<10^(-12)',
  '1',

  'abs(float(subst(r[1],x,p)))<10^(-9)',
  '1',

  'abs(float(subst(r[2],x,p)))<10^(-9)',
  '1',
]);

run_test([
  // together with the roots of other factors, still ascending:
  // (x-5)*(x^3-3*x+1)
  'roots(x^4-5*x^3-3*x^2+16*x-5)',
  '[2*cos(8/9*pi),2*cos(4/9*pi),2*cos(2/9*pi),5]',

  // x*(x^3-3*x-1)
  'roots(x^4-3*x^2-x)',
  '[2*cos(7/9*pi),2*cos(5/9*pi),0,2*cos(1/9*pi)]',

  // a real but irrational coefficient: p = -3, q = sqrt(2),
  // arccos(-1/2*sqrt(2))/3 = 1/4*pi, the largest root is 2*cos(1/4*pi)
  // -1.9318516526, 0.5176380902, 1.4142135624
  'p=x^3-3*x+2^(1/2)',
  '',

  'r=roots(p)',
  '',

  'r[3]',
  '2^(1/2)',

  'float(r)',
  '[-1.931852...,0.517638...,1.414214...]',

  'abs(float(subst(r[1],x,p)))<10^(-9)',
  '1',

  'abs(float(subst(r[2],x,p)))<10^(-9)',
  '1',
]);

run_test([
  // symbolic coefficients: only when the discriminant is known to be
  // negative. x^3-3*a^2*x+a^3 has 4*p^3+27*q^2 = -81*a^6, the roots are
  // a times those of x^3-3*x+1
  'assume(a,positive)',
  '',

  'r=roots(x^3-3*a^2*x+a^3,x)',
  '',

  // a = 2: -3.7587704831, 0.6945927107, 3.0641777725
  'float(subst(2,a,r[1]*r[2]*r[3]))',
  '-8.0',

  'simplify(subst(r[1],x,x^3-3*a^2*x+a^3))',
  '0',

  'imag(r[1])',
  '0',

  'imag(r[2])',
  '0',

  'imag(r[3])',
  '0',

  'forget(a)',
  '',
]);

run_test([
  // a of unknown sign may be 0 (a triple root): the rule must not fire,
  // Cardano's formula stays
  'r=roots(x^3-3*a^2*x+a^3,x)',
  '',

  'r[3]',
  '-1/3*(27/2*a^3+27/2*i*3^(1/2)*(a^6)^(1/2))^(1/3)-3*a^2/((27/2*a^3+27/2*i*3^(1/2)*(a^6)^(1/2))^(1/3))',

  // a = 2: the root -3.7587704831
  'abs(float(subst(2,a,r[3]))+3.7587704831)<10^(-9)',
  '1',
]);

run_test([
  // quartics with four real roots: the resolvent cubic is a casus
  // irreducibilis. x^4-4*x^2+x+1 changes sign between -3, -2, 0, 1, 2
  'p=x^4-4*x^2+x+1',
  '',

  'r=roots(p)',
  '',

  'abs(float(subst(r[1],x,p)))<10^(-9)',
  '1',

  'abs(float(subst(r[2],x,p)))<10^(-9)',
  '1',

  'abs(float(subst(r[3],x,p)))<10^(-9)',
  '1',

  'abs(float(subst(r[4],x,p)))<10^(-9)',
  '1',

  // numpy: -2.0614988507, -0.3963385310, 0.6938224565, 1.7640149252
  'float(r)',
  '[-2.061499...,-0.396339...,0.693822...,1.764015...]',
]);

run_test([
  // shifted by 1, which gives a cubic term: (x-1)^4-4*(x-1)^2+(x-1)+1
  'p=x^4-4*x^3+2*x^2+5*x-3',
  '',

  'r=roots(p)',
  '',

  'abs(float(subst(r[1],x,p)))<10^(-9)',
  '1',

  'abs(float(subst(r[4],x,p)))<10^(-9)',
  '1',

  // numpy: -1.0614988507, 0.6036614690, 1.6938224565, 2.7640149252
  'float(r)',
  '[-1.061499...,0.603661...,1.693822...,2.764015...]',
]);

run_test([
  // x^4-5*x^2+2*x+1 changes sign between -3, -2, 0, 1, 2
  'p=x^4-5*x^2+2*x+1',
  '',

  'r=roots(p)',
  '',

  'abs(float(subst(r[1],x,p)))<10^(-9)',
  '1',

  'abs(float(subst(r[2],x,p)))<10^(-9)',
  '1',

  'abs(float(subst(r[3],x,p)))<10^(-9)',
  '1',

  'abs(float(subst(r[4],x,p)))<10^(-9)',
  '1',

  'and(float(r[1])<float(r[2]),float(r[2])<float(r[3]),float(r[3])<float(r[4]))',
  '1',
]);

run_test([
  // ---- must not change ----
  // quadratics
  'roots(x^2-5*x+6)',
  '[2,3]',

  'roots(x^2+1)',
  '[-i,i]',

  'roots(x^2-2)',
  '[-2^(1/2),2^(1/2)]',

  'solve(x^2+x+1,x)',
  '[-1/2-1/2*i*3^(1/2),-1/2+1/2*i*3^(1/2)]',

  'roots(a*x^2+b*x+c,x)',
  '[-1/2*(b^2/(a^2)-4*c/a)^(1/2)-b/(2*a),1/2*(b^2/(a^2)-4*c/a)^(1/2)-b/(2*a)]',

  // cubics with three real roots that factor over Q
  'roots(x^3-6*x^2+11*x-6)',
  '[1,2,3]',

  'roots(x^3-7*x+6)',
  '[-3,1,2]',

  'roots(x^3-x)',
  '[-1,0,1]',

  'roots(x^3-2*x)',
  '[0,-2^(1/2),2^(1/2)]',

  // (x-2)*(x^2+2*x-2)
  'roots(x^3-6*x+4)',
  '[2,-1-3^(1/2),-1+3^(1/2)]',

  // discriminant zero: (x-1)^2*(x+2), (x-2)^2*(x+4), (x-1)^3
  'roots(x^3-3*x+2)',
  '[-2,1]',

  'roots(x^3-12*x+16)',
  '[-4,2]',

  'roots((x-1)^3)',
  '1',

  // x^n = a
  'roots(x^3=8)',
  '[2,-1-i*3^(1/2),-1+i*3^(1/2)]',

  'roots(x^3-1)',
  '[1,-1/2-1/2*i*3^(1/2),-1/2+1/2*i*3^(1/2)]',

  'roots(x^3-2)',
  '[-1/2*2^(1/3)-1/2*i*2^(1/3)*3^(1/2),-1/2*2^(1/3)+1/2*i*2^(1/3)*3^(1/2),2^(1/3)]',

  'roots(x^4=1)',
  '[-1,1,-i,i]',

  'roots(x^4+1)',
  '[-1/2*2^(1/2)-1/2*i*2^(1/2),-1/2*2^(1/2)+1/2*i*2^(1/2),1/2*2^(1/2)-1/2*i*2^(1/2),1/2*2^(1/2)+1/2*i*2^(1/2)]',

  // biquadratic with four real roots
  'roots(x^4-5*x^2+4)',
  '[-2,-1,1,2]',

  'roots(x^4-10*x^2+1)',
  '[-2^(1/2)+3^(1/2),2^(1/2)-3^(1/2),2^(1/2)+3^(1/2),-(2^(1/2)+3^(1/2))]',
]);

run_test([
  // one real root and a complex pair (positive discriminant): Cardano stays
  // x^3+3*x+1: 4*27+27 > 0, the real root is -0.3221853546
  'r=roots(x^3+3*x+1)',
  '',

  'r[3]',
  '3/((27/2+27/2*5^(1/2))^(1/3))-1/3*(27/2+27/2*5^(1/2))^(1/3)',

  'float(r[3])',
  '-0.322185...',

  // x^3-3*x+3: 4*(-27)+27*9 > 0, the real root is -2.1038034027
  'r=roots(x^3-3*x+3)',
  '',

  'r[3]',
  '-3/((81/2+27/2*5^(1/2))^(1/3))-1/3*(81/2+27/2*5^(1/2))^(1/3)',

  'float(r[3])',
  '-2.103803...',

  // imaginary coefficients are left alone
  'roots(x^3-3*i*x^2-3*x+i)',
  'i',

  // assumptions about the variable filter the trigonometric roots as well:
  // only 2*cos(8/9*pi) is negative
  'assume(x,negative)',
  '',

  'roots(x^3-3*x+1)',
  '2*cos(8/9*pi)',

  'forget(x)',
  '',

  'assume(x>0)',
  '',

  'solve(x^3-3*x+1,x)',
  '[2*cos(4/9*pi),2*cos(2/9*pi)]',

  'roots(x^3-7*x+6)',
  '[1,2]',

  'solve(x^2=4,x)',
  '2',

  // a root without symbols is decided numerically: 1-sqrt(2) < 0
  'solve(x^2-2*x-1,x)',
  '1+2^(1/2)',

  'forget(x)',
  '',

  'solve(x^2-2*x-1,x)',
  '[1-2^(1/2),1+2^(1/2)]',

  // float coefficients are not polynomial input for roots, as before
  'roots(x^3-3.0*x+1)',
  'Stop: roots: 1st argument is not a polynomial in the variable x',

  'nroots(x^3-3*x+1)',
  '[-1.879385...,0.347296...,1.532089...]',
]);
