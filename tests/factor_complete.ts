import { run_test } from '../test-harness';

// factor(p, x) of a polynomial with rational coefficients is complete: the
// rational-root and quadratic searches of factorpoly.ts come first (their
// factors keep their discovery order), what is left goes through
// square-free decomposition, factorization mod p, Hensel lifting and
// recombination (sources/factor_zassenhaus.ts). Those factors are sorted by
// degree, then by coefficients from the top, larger first.
//
// Every expected factorization was computed with sympy.factor_list and the
// irreducibility of each factor checked there; each block also multiplies
// the result out again. One block per polynomial: the harness stops a block
// at its first failure.

run_test([
  'factor(x^100-1)',
  '(x-1)*(x+1)*(x^4+x^3+x^2+x+1)*(x^4-x^3+x^2-x+1)*(x^8-x^6+x^4-x^2+1)*(x^20-x^15+x^10-x^5+1)*(x^40-x^30+x^20-x^10+1)*(x^2+1)*(x^20+x^15+x^10+x^5+1)',

  // multiplying out gives the input back
  'expand(last)-(x^100-1)',
  '0',
]);

run_test([
  'factor(x^15-1)',
  '(x-1)*(x^2+x+1)*(x^4+x^3+x^2+x+1)*(x^8-x^7+x^5-x^4+x^3-x+1)',

  // multiplying out gives the input back
  'expand(last)-(x^15-1)',
  '0',
]);

run_test([
  'factor(x^10+x^5+1)',
  '(x^2+x+1)*(x^8-x^7+x^5-x^4+x^3-x+1)',

  // multiplying out gives the input back
  'expand(last)-(x^10+x^5+1)',
  '0',
]);

run_test([
  'factor((x^3+x+1)*(x^3+x^2+1))',
  '(x^3+x+1)*(x^3+x^2+1)',

  // multiplying out gives the input back
  'expand(last)-((x^3+x+1)*(x^3+x^2+1))',
  '0',
]);

run_test([
  'factor((x^3+x+1)^2)',
  '(x^3+x+1)^2',

  // multiplying out gives the input back
  'expand(last)-((x^3+x+1)^2)',
  '0',
]);

run_test([
  'factor((x^3-x+1)^3*(x^4+x+1)^2)',
  '(x^4+x+1)^2*(x^3-x+1)^3',

  // multiplying out gives the input back
  'expand(last)-((x^3-x+1)^3*(x^4+x+1)^2)',
  '0',
]);

run_test([
  'factor(x^8-40*x^6+352*x^4-960*x^2+576)',
  'x^8-40*x^6+352*x^4-960*x^2+576',

  // multiplying out gives the input back
  'expand(last)-(x^8-40*x^6+352*x^4-960*x^2+576)',
  '0',
]);

run_test([
  'factor(x^4-10*x^2+1)',
  'x^4-10*x^2+1',

  // multiplying out gives the input back
  'expand(last)-(x^4-10*x^2+1)',
  '0',
]);

run_test([
  'factor(x^6+x^5+x^4+x^3+x^2+x+1)',
  'x^6+x^5+x^4+x^3+x^2+x+1',

  // multiplying out gives the input back
  'expand(last)-(x^6+x^5+x^4+x^3+x^2+x+1)',
  '0',
]);

run_test([
  'factor(x^5-x-1)',
  'x^5-x-1',

  // multiplying out gives the input back
  'expand(last)-(x^5-x-1)',
  '0',
]);

run_test([
  'factor((2*x^3+x+1)*(3*x^3-x^2+2))',
  '(2*x^3+x+1)*(3*x^3-x^2+2)',

  // multiplying out gives the input back
  'expand(last)-((2*x^3+x+1)*(3*x^3-x^2+2))',
  '0',
]);

run_test([
  'factor((2*x^3+3)*(5*x^4+x+7))',
  '(2*x^3+3)*(5*x^4+x+7)',

  // multiplying out gives the input back
  'expand(last)-((2*x^3+3)*(5*x^4+x+7))',
  '0',
]);

run_test([
  'factor(-(2*x^3+x+1)*(3*x^3-x^2+2))',
  '-(2*x^3+x+1)*(3*x^3-x^2+2)',

  // multiplying out gives the input back
  'expand(last)-(-(2*x^3+x+1)*(3*x^3-x^2+2))',
  '0',
]);

run_test([
  'factor(6*(x^3+x+1)*(x^4+x+1))',
  '6*(x^3+x+1)*(x^4+x+1)',

  // multiplying out gives the input back
  'expand(last)-(6*(x^3+x+1)*(x^4+x+1))',
  '0',
]);

run_test([
  'factor((x^3+1000003*x+7)*(x^3-999983*x^2+11))',
  '(x^3+1000003*x+7)*(x^3-999983*x^2+11)',

  // multiplying out gives the input back
  'expand(last)-((x^3+1000003*x+7)*(x^3-999983*x^2+11))',
  '0',
]);

run_test([
  'factor(x^6/8-1)',
  '1/8*(x^2-2)*(x^4+2*x^2+4)',

  // multiplying out gives the input back
  'expand(last)-(x^6/8-1)',
  '0',
]);

run_test([
  'factor((x^3/2+x+1)*(x^3+x^2/3+1))',
  '1/6*(x^3+2*x+2)*(3*x^3+x^2+3)',

  // multiplying out gives the input back
  'expand(last)-((x^3/2+x+1)*(x^3+x^2/3+1))',
  '0',
]);

run_test([
  'factor(x^105-1)',
  '(x-1)*(x^2+x+1)*(x^48+x^47+x^46-x^43-x^42-2*x^41-x^40-x^39+x^36+x^35+x^34+x^33+x^32+x^31-x^28-x^26-x^24-x^22-x^20+x^17+x^16+x^15+x^14+x^13+x^12-x^9-x^8-2*x^7-x^6-x^5+x^2+x+1)*(x^4+x^3+x^2+x+1)*(x^6+x^5+x^4+x^3+x^2+x+1)*(x^8-x^7+x^5-x^4+x^3-x+1)*(x^12-x^11+x^9-x^8+x^6-x^4+x^3-x+1)*(x^24-x^23+x^19-x^18+x^17-x^16+x^14-x^13+x^12-x^11+x^10-x^8+x^7-x^6+x^5-x+1)',

  // multiplying out gives the input back
  'expand(last)-(x^105-1)',
  '0',
]);

run_test([
  'factor(x^64-1)',
  '(x-1)*(x+1)*(x^2+1)*(x^4+1)*(x^8+1)*(x^16+1)*(x^32+1)',

  // multiplying out gives the input back
  'expand(last)-(x^64-1)',
  '0',
]);

run_test([
  'factor(x^60-1)',
  '(x-1)*(x+1)*(x^8+x^7-x^5-x^4-x^3+x+1)*(x^2+x+1)*(x^4+x^3+x^2+x+1)*(x^2-x+1)*(x^4-x^3+x^2-x+1)*(x^8-x^7+x^5-x^4+x^3-x+1)*(x^4-x^2+1)*(x^8-x^6+x^4-x^2+1)*(x^2+1)*(x^16+x^14-x^10-x^8-x^6+x^2+1)',

  // multiplying out gives the input back
  'expand(last)-(x^60-1)',
  '0',
]);

run_test([
  'factor(x^16+x^8+1)',
  '(x^2+x+1)*(x^2-x+1)*(x^4-x^2+1)*(x^8-x^4+1)',

  // multiplying out gives the input back
  'expand(last)-(x^16+x^8+1)',
  '0',
]);

run_test([
  'factor(x^12+x^6+1)',
  '(x^6-x^3+1)*(x^6+x^3+1)',

  // multiplying out gives the input back
  'expand(last)-(x^12+x^6+1)',
  '0',
]);

run_test([
  'factor(x^8+x^4+1)',
  '(x^2+x+1)*(x^2-x+1)*(x^4-x^2+1)',

  // multiplying out gives the input back
  'expand(last)-(x^8+x^4+1)',
  '0',
]);

run_test([
  'factor(x^2-(2^128+1))',
  'x^2-340282366920938463463374607431768211457',

  // multiplying out gives the input back
  'expand(last)-(x^2-(2^128+1))',
  '0',
]);

run_test([
  'factor(x^3-(2^128+1))',
  'x^3-340282366920938463463374607431768211457',

  // multiplying out gives the input back
  'expand(last)-(x^3-(2^128+1))',
  '0',
]);

run_test([
  'factor((x^3+2^70+1)*(x^3-x+2^70))',
  '(x^3-x+1180591620717411303424)*(x^3+1180591620717411303425)',

  // multiplying out gives the input back
  'expand(last)-((x^3+2^70+1)*(x^3-x+2^70))',
  '0',
]);

run_test([
  'factor(x^2-2^70*x+2^70-1)',
  '(x-1180591620717411303423)*(x-1)',

  // multiplying out gives the input back
  'expand(last)-(x^2-2^70*x+2^70-1)',
  '0',
]);

run_test([
  'factor(x^9+x^6+x^3+1)',
  '(x+1)*(x^2-x+1)*(x^4-x^2+1)*(x^2+1)',

  // multiplying out gives the input back
  'expand(last)-(x^9+x^6+x^3+1)',
  '0',
]);

run_test([
  'factor(x^10-1024)',
  '(x-2)*(x+2)*(x^4-2*x^3+4*x^2-8*x+16)*(x^4+2*x^3+4*x^2+8*x+16)',

  // multiplying out gives the input back
  'expand(last)-(x^10-1024)',
  '0',
]);

run_test([
  'factor(x^6-64)',
  '(x-2)*(x+2)*(x^2-2*x+4)*(x^2+2*x+4)',

  // multiplying out gives the input back
  'expand(last)-(x^6-64)',
  '0',
]);

run_test([
  'factor(x^8-16)',
  '(x^2-2)*(x^2-2*x+2)*(x^2+2*x+2)*(x^2+2)',

  // multiplying out gives the input back
  'expand(last)-(x^8-16)',
  '0',
]);

run_test([
  'factor(x^6+27)',
  '(x^2-3*x+3)*(x^2+3*x+3)*(x^2+3)',

  // multiplying out gives the input back
  'expand(last)-(x^6+27)',
  '0',
]);

run_test([
  'factor((x^5+x^2+1)*(x^5+x^3+1)*(x^5-x-1))',
  '(x^5-x-1)*(x^5+x^2+1)*(x^5+x^3+1)',

  // multiplying out gives the input back
  'expand(last)-((x^5+x^2+1)*(x^5+x^3+1)*(x^5-x-1))',
  '0',
]);

run_test([
  'factor((x^4+x+1)*(x^4+x^3+1)*(x^4+x^3+x^2+x+1))',
  '(x^4+x^3+x^2+x+1)*(x^4+x+1)*(x^4+x^3+1)',

  // multiplying out gives the input back
  'expand(last)-((x^4+x+1)*(x^4+x^3+1)*(x^4+x^3+x^2+x+1))',
  '0',
]);

run_test([
  'factor((x-1)*(x+2)*(x^3+x+1)*(x^3-x-1))',
  '(x-1)*(x^3-x-1)*(x^3+x+1)*(x+2)',

  // multiplying out gives the input back
  'expand(last)-((x-1)*(x+2)*(x^3+x+1)*(x^3-x-1))',
  '0',
]);

run_test([
  'factor(x*(x^3+2)*(x^3-2))',
  'x*(x^3-2)*(x^3+2)',

  // multiplying out gives the input back
  'expand(last)-(x*(x^3+2)*(x^3-2))',
  '0',
]);

run_test([
  'factor((x^2+1)*(x^3+x+1)^2)',
  '(x^3+x+1)^2*(x^2+1)',

  // multiplying out gives the input back
  'expand(last)-((x^2+1)*(x^3+x+1)^2)',
  '0',
]);

run_test([
  'factor((x^7+x+1)*(x^7-x+1))',
  '(x^7+x+1)*(x^7-x+1)',

  // multiplying out gives the input back
  'expand(last)-((x^7+x+1)*(x^7-x+1))',
  '0',
]);

run_test([
  'factor((3*x^4+2*x+5)*(7*x^5-x^2+3))',
  '(7*x^5-x^2+3)*(3*x^4+2*x+5)',

  // multiplying out gives the input back
  'expand(last)-((3*x^4+2*x+5)*(7*x^5-x^2+3))',
  '0',
]);

run_test([
  'factor(x^16-136*x^14+6476*x^12-141912*x^10+1513334*x^8-7453176*x^6+13950764*x^4-5596840*x^2+46225)',
  'x^16-136*x^14+6476*x^12-141912*x^10+1513334*x^8-7453176*x^6+13950764*x^4-5596840*x^2+46225',

  // multiplying out gives the input back
  'expand(last)-(x^16-136*x^14+6476*x^12-141912*x^10+1513334*x^8-7453176*x^6+13950764*x^4-5596840*x^2+46225)',
  '0',
]);

// regressions: what factorpoly.ts did before must not change
run_test([
  'factor(x^6-1)',
  '(x-1)*(x+1)*(x^2+x+1)*(x^2-x+1)',

  'factor(x^4+4,x)',
  '(x^2-2*x+2)*(x^2+2*x+2)',

  'factor(x^2-2,x)',
  'x^2-2',

  'factor(x^5+x+1)',
  '(x^2+x+1)*(x^3-x^2+1)',

  'factor(6*x^4-5*x^3-38*x^2-5*x+6)',
  '(x-3)*(3*x-1)*(2*x+1)*(x+2)',

  'factor((x-1)^2*(x+2))',
  '(x-1)^2*(x+2)',

  'factor(i*x^2+i)',
  'i*(x^2+1)',

  // symbolic coefficients stay with the old search
  'factor(x^3*y^3-1,x)',
  '(-1+x*y)*(1+x*y+x^2*y^2)',

  'factor(x^2-1,y)',
  'x^2-1',

  // not a polynomial
  'factor(sin(x)^2-1)',
  '-1+sin(x)^2',

  'factor(x^(1/2)-1)',
  '-1+x^(1/2)',

  // other variable names
  'factor((t^3+t+1)*(t^3+t^2+1),t)',
  '(t^3+t+1)*(t^3+t^2+1)',

  'factor((s^3+s+1)^2)',
  '(s^3+s+1)^2',

  // roots profits from the complete factorization (before: "not
  // factorable"): the roots of x^3-2 and of x^3-3 as roots() gives them for
  // each factor alone, r, r*w and r*w^2 with w = -1/2+i*3^(1/2)/2
  'roots((x^3-2)*(x^3-3))',
  '[-1/2*2^(1/3)-1/2*i*2^(1/3)*3^(1/2),-1/2*2^(1/3)+1/2*i*2^(1/3)*3^(1/2),-1/2*3^(1/3)-1/2*i*3^(5/6),-1/2*3^(1/3)+1/2*i*3^(5/6),2^(1/3),3^(1/3)]',

  // each of them is a root
  'float(abs(subst(roots((x^3-2)*(x^3-3))[1],x,(x^3-2)*(x^3-3))))<10^(-9)',
  '1',

  'float(abs(subst(roots((x^3-2)*(x^3-3))[3],x,(x^3-2)*(x^3-3))))<10^(-9)',
  '1',

  'float(abs(subst(roots((x^3-2)*(x^3-3))[4],x,(x^3-2)*(x^3-3))))<10^(-9)',
  '1',
]);
