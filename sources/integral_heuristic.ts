import {
  ABS,
  ARCCOS,
  ARCSIN,
  ARCTAN,
  ARCTANH,
  caddr,
  cadr,
  car,
  Constants,
  COS,
  E,
  ERF,
  COSH,
  doexpand,
  noexpand,
  iscons,
  isdouble,
  isadd,
  ismultiply,
  isNumericAtom,
  ispower,
  isrational,
  LOG,
  SIN,
  SINH,
  TAN,
  U
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { abs } from './abs';
import { symbol, usr_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { integer, rational } from './bignum';
import { coeff } from './coeff';
import { denominator } from './denominator';
import { derivative } from './derivative';
import { Eval } from './eval';
import { zzfloat } from './float';
import { gcd } from './gcd';
import { integral } from './integral';
import { equal } from './misc';
import { isNegative, isPositive } from './assume';
import {
  equalq,
  iseveninteger,
  isinteger,
  isnegativeterm,
  isnegativenumber,
  isposint,
  ispolyexpandedform,
  isZeroAtomOrTensor
} from './is';
import { makeList } from './list';
import { logarithm } from './log';
import { divide, multiply, negate } from './multiply';
import { numerator } from './numerator';
import { partition } from './partition';
import { power } from './power';
import { divpoly } from './quotient';
import { rationalize } from './rationalize';
import { subst } from './subst';

// Integration methods tried when the table (and partial fractions) fail:
// closed forms for exp(a*x)*sin(b*x), abs(linear) and 1/(quadratic with
// real roots), then tan^2 rewriting, u-substitution and integration by
// parts. Each returns undefined when it does not apply. Sub-integrals go
// back through integral(), so the methods combine; depth bounds the recursion.
// A quadratic with a linear term is shifted to the table forms, a rational
// function of sin, cos, tan becomes one of u = tan(x) or of t = tan(x/2).
// ponytail: no Risch; add a method here when a class of integrands keeps
// failing.

const MAX_DEPTH = 5;

export function heuristicIntegral(F: U, X: U, depth: number): U | undefined {
  if (depth > MAX_DEPTH) {
    return undefined;
  }
  // partition splits the factors of a product, anything else is one factor
  const [c, G] = ismultiply(F) ? partition(F, X) : [Constants.one, F];
  const r =
    expTrig(G, X) ||
    absLinear(G, X) ||
    quadraticLog(G, X) ||
    completeSquare(G, X, depth) ||
    specialIntegral(G, X) ||
    sqrtTan(G, X) ||
    quarticReciprocal(G, X) ||
    hyperbolicToExp(G, X, depth) ||
    tanSquared(G, X, depth) ||
    bySubstitution(G, X, depth) ||
    tanSubstitution(G, X, depth) ||
    weierstrass(G, X, depth) ||
    byParts(G, X, depth);
  return r === undefined ? undefined : multiply(c, r);
}

function tryIntegral(F: U, X: U, depth: number): U | undefined {
  try {
    return integral(F, X, depth + 1);
  } catch (e) {
    return undefined;
  }
}

function factorsOf(F: U): U[] {
  return ismultiply(F) ? F.tail() : [F];
}

function isFn(p: U, name: string): boolean {
  return iscons(p) && car(p) === symbol(name);
}

// the slope of an expression linear in X, undefined otherwise
function slope(p: U, X: U): U | undefined {
  const a = derivative(p, X);
  return Find(a, X) || isZeroAtomOrTensor(a) ? undefined : a;
}

// exp(p)*sin(q) = exp(p)*(a*sin(q)-b*cos(q))/(a^2+b^2), p' = a, q' = b,
// and exp(p)*cos(q) = exp(p)*(a*cos(q)+b*sin(q))/(a^2+b^2)
function expTrig(F: U, X: U): U | undefined {
  const fs = factorsOf(F);
  if (fs.length !== 2) {
    return undefined;
  }
  const ex = fs.find((f) => ispower(f) && cadr(f) === symbol(E));
  const tr = fs.find((f) => isFn(f, SIN) || isFn(f, COS));
  if (!ex || !tr) {
    return undefined;
  }
  const a = slope(caddr(ex), X);
  const b = slope(cadr(tr), X);
  if (!a || !b) {
    return undefined;
  }
  const q = cadr(tr);
  const other = makeList(symbol(isFn(tr, SIN) ? COS : SIN), q);
  const num = isFn(tr, SIN)
    ? subtract(multiply(a, tr), multiply(b, other))
    : add(multiply(a, tr), multiply(b, other));
  return Eval(divide(multiply(ex, num), add(power(a, integer(2)), power(b, integer(2)))));
}

// abs(g) with g = a*X+b: g*abs(g)/(2*a)
function absLinear(F: U, X: U): U | undefined {
  if (!isFn(F, ABS)) {
    return undefined;
  }
  const g = cadr(F);
  const a = slope(g, X);
  return a && divide(multiply(g, F), multiply(integer(2), a));
}

// 1/(c2*X^2+c1*X+c0) with D = c1^2-4*c0*c2 > 0:
// log|(2*c2*X+c1-sqrt(D))/(2*c2*X+c1+sqrt(D))|/sqrt(D)
function quadraticLog(F: U, X: U): U | undefined {
  if (!ispower(F) || !equal(caddr(F), Constants.negOne) || !ispolyexpandedform(cadr(F), X)) {
    return undefined;
  }
  const k = coeff(cadr(F), X);
  if (k.length !== 3) {
    return undefined;
  }
  const [c0, c1, c2] = k;
  const D = subtract(power(c1, integer(2)), multiply(integer(4), multiply(c0, c2)));
  if (isZeroAtomOrTensor(D) || isnegativenumber(D) || isPositive(D) !== true) {
    return undefined;
  }
  const s = power(D, rational(1, 2));
  const lin = add(multiply(integer(2), multiply(c2, X)), c1);
  const q = divide(
    makeList(symbol(ABS), subtract(lin, s)),
    makeList(symbol(ABS), add(lin, s))
  );
  return divide(makeList(symbol(LOG), q), s);
}

// Integrals that are special functions by definition: sin(a*X)/X = Si,
// cos(a*X)/X = Ci, exp(a*X)/X = Ei, 1/log(X) = Ei(log(X)), and with
// k = sqrt(2*a/pi), a > 0: sin(a*X^2) = fresnels(k*X)/k, cos likewise
function specialIntegral(F: U, X: U): U | undefined {
  const fn = (name: string, arg: U) => Eval(makeList(usr_symbol(name), arg));
  const isInverseOf = (f: U, g: (b: U) => boolean) =>
    ispower(f) && equal(caddr(f), Constants.negOne) && g(cadr(f));
  if (isInverseOf(F, (b) => isFn(b, LOG) && equal(cadr(b), X))) {
    return fn('Ei', cadr(F));
  }
  const fs = factorsOf(F);
  const overX = fs.find((f) => isInverseOf(f, (b) => equal(b, X)));
  if (fs.length === 2 && overX) {
    const g = fs.find((f) => f !== overX);
    const isExp = ispower(g) && cadr(g) === symbol(E);
    if (isFn(g, SIN) || isFn(g, COS) || isExp) {
      const arg = isExp ? caddr(g) : cadr(g);
      if (!Find(divide(arg, X), X)) {
        return fn(isFn(g, SIN) ? 'Si' : isFn(g, COS) ? 'Ci' : 'Ei', arg);
      }
    }
  }
  if (isFn(F, SIN) || isFn(F, COS)) {
    const a = divide(cadr(F), power(X, integer(2)));
    if (!Find(a, X) && isPositive(a) === true) {
      const k = power(divide(multiply(integer(2), a), Constants.Pi()), rational(1, 2));
      return divide(fn(isFn(F, SIN) ? 'fresnels' : 'fresnelc', multiply(k, X)), k);
    }
  }
  return undefined;
}

// 1/(c4*X^4+c0) with c = c0/c4 > 0 and a = c^(1/4):
// log((X^2+sqrt(2)*a*X+a^2)/(X^2-sqrt(2)*a*X+a^2))/(4*sqrt(2)*a^3)
// + (arctan(sqrt(2)*X/a+1)+arctan(sqrt(2)*X/a-1))/(2*sqrt(2)*a^3), over c4
function quarticReciprocal(F: U, X: U): U | undefined {
  if (!ispower(F) || !equal(caddr(F), Constants.negOne) || !ispolyexpandedform(cadr(F), X)) {
    return undefined;
  }
  const k = coeff(cadr(F), X);
  if (k.length !== 5 || !k.slice(1, 4).every((c) => isZeroAtomOrTensor(c))) {
    return undefined;
  }
  const c = divide(k[0], k[4]);
  if (isPositive(c) !== true) {
    return undefined;
  }
  const a = power(c, rational(1, 4));
  const r2 = power(integer(2), rational(1, 2));
  const a2 = power(a, integer(2));
  const mid = multiply(multiply(r2, a), X);
  const x2 = power(X, integer(2));
  const log = makeList(
    symbol(LOG),
    divide(add(add(x2, mid), a2), add(subtract(x2, mid), a2))
  );
  const u = divide(multiply(r2, X), a);
  const atan = add(
    makeList(symbol(ARCTAN), add(u, Constants.one)),
    makeList(symbol(ARCTAN), subtract(u, Constants.one))
  );
  const a3 = power(a, integer(3));
  return Eval(
    divide(
      add(
        divide(log, multiply(multiply(integer(4), r2), a3)),
        divide(atan, multiply(multiply(integer(2), r2), a3))
      ),
      k[4]
    )
  );
}

// exp together with sinh or cosh: the hyperbolic functions in exp form
function hyperbolicToExp(F: U, X: U, depth: number): U | undefined {
  const hasExp = findWhere(F, (p) => ispower(p) && cadr(p) === symbol(E) && Find(caddr(p), X));
  const hyp = findWhere(F, (p) => (isFn(p, SINH) || isFn(p, COSH)) && Find(cadr(p), X));
  if (!hasExp || !hyp) {
    return undefined;
  }
  const u = cadr(hyp);
  const plus = power(symbol(E), u);
  const minus = power(symbol(E), negate(u));
  const asExp = divide(isFn(hyp, SINH) ? subtract(plus, minus) : add(plus, minus), integer(2));
  return tryIntegral(doexpand(Eval, subst(F, hyp, asExp)), X, depth);
}

// 1/(a+b*cos(q)) and 1/(a+b*sin(q)), q linear in X, numbers a^2 > b^2:
//   cos: 2/s*arctan(sqrt((a-b)/(a+b))*tan(q/2)), s = sqrt(a^2-b^2)
//   sin: 2/s*arctan((a*tan(q/2)+b)/s)
// With a^2 < b^2 the half-angle substitution gives real logarithms.
// Tried before the table, whose entry for these is a complex logarithm.
export function realTrigReciprocal(F: U, X: U, depth: number): U | undefined {
  if (!ispower(F) || !equal(caddr(F), Constants.negOne)) {
    return undefined;
  }
  const S = cadr(F);
  const t = findWhere(S, (p) => (isFn(p, SIN) || isFn(p, COS)) && Find(cadr(p), X));
  if (!t) {
    return undefined;
  }
  const q = cadr(t);
  const slopeQ = slope(q, X);
  const u = usr_symbol('integral_u');
  const Su = subst(S, t, u);
  const b = derivative(Su, u);
  const a = Eval(subtract(Su, multiply(b, u)));
  const [an, bn] = [zzfloat(a), zzfloat(b)];
  // a = 0 is 1/cos or 1/sin, a^2 = b^2 has a tan without a log: both in the table
  if (!slopeQ || !isdouble(an) || !isdouble(bn) || an.d === 0 || an.d * an.d === bn.d * bn.d) {
    return undefined;
  }
  if (an.d * an.d < bn.d * bn.d) {
    return weierstrass(F, X, depth);
  }
  if (an.d < 0) {
    const flipped = realTrigReciprocal(power(negate(S), Constants.negOne), X, depth);
    return flipped && negate(flipped);
  }
  const s = power(subtract(power(a, integer(2)), power(b, integer(2))), rational(1, 2));
  const tanHalf = makeList(symbol(TAN), divide(q, integer(2)));
  const inner = isFn(t, COS)
    ? multiply(power(divide(subtract(a, b), add(a, b)), rational(1, 2)), tanHalf)
    : divide(add(multiply(a, tanHalf), b), s);
  return Eval(
    divide(multiply(integer(2), makeList(symbol(ARCTAN), inner)), multiply(s, slopeQ))
  );
}

// (c2*X^2+c1*X+c0)^r with c1 != 0, r a root or a negative power: with
// u = X+c1/(2*c2) the quadratic is c2*u^2+c0-c1^2/(4*c2), a table form.
// For an integer r the table picks arctan or log by the sign of
// 4*c0*c2-c1^2 and takes an undecidable sign as met, so it is asked here;
// the entries for the roots ask for the sign of c2 themselves.
function completeSquare(F: U, X: U, depth: number): U | undefined {
  let k: U[] = [];
  const q = findWhere(F, (p) => {
    if (!ispower(p) || !isNumericAtom(caddr(p)) || isposint(caddr(p))) {
      return false;
    }
    if (!ispolyexpandedform(cadr(p), X)) {
      return false;
    }
    k = coeff(cadr(p), X);
    return k.length === 3 && !isZeroAtomOrTensor(k[1]);
  });
  if (!q) {
    return undefined;
  }
  const [c0, c1, c2] = k;
  const D = subtract(multiply(integer(4), multiply(c0, c2)), power(c1, integer(2)));
  if (isinteger(caddr(q)) && isPositive(D) !== true && isNegative(D) !== true) {
    return undefined;
  }
  const u = usr_symbol('integral_v');
  const h = divide(c1, multiply(integer(2), c2));
  const shifted = add(
    multiply(c2, power(u, integer(2))),
    subtract(c0, divide(power(c1, integer(2)), multiply(integer(4), c2)))
  );
  const G = subst(subst(F, cadr(q), shifted), X, subtract(u, h));
  const I = tryIntegral(doexpand(Eval, G), u, depth);
  return I && Eval(subst(I, u, add(X, h)));
}

// sqrt(tan(q)), q linear in X: with u = sqrt(tan(q)) the integrand is
// 2*u^2/(1+u^4), so with m = sqrt(2)*u the integral is
// (log(u^2-m+1)-log(u^2+m+1))/(2*sqrt(2)) + (arctan(m+1)+arctan(m-1))/sqrt(2)
function sqrtTan(F: U, X: U): U | undefined {
  if (!ispower(F) || !isFn(cadr(F), TAN) || !equalq(caddr(F), 1, 2)) {
    return undefined;
  }
  const a = slope(cadr(cadr(F)), X);
  if (!a) {
    return undefined;
  }
  const r2 = power(integer(2), rational(1, 2));
  const m = multiply(r2, F);
  const t1 = add(cadr(F), Constants.one);
  // both arguments are positive: (u-1/sqrt(2))^2+1/2 and (u+1/sqrt(2))^2+1/2
  const log = subtract(makeList(symbol(LOG), subtract(t1, m)), makeList(symbol(LOG), add(t1, m)));
  const atan = add(
    makeList(symbol(ARCTAN), add(m, Constants.one)),
    makeList(symbol(ARCTAN), subtract(m, Constants.one))
  );
  return Eval(divide(add(divide(log, multiply(integer(2), r2)), divide(atan, r2)), a));
}

// the argument q of the first sin, cos or tan with X in it, if linear in X
function trigArgument(F: U, X: U): U | undefined {
  const t = findWhere(
    F,
    (p) => (isFn(p, SIN) || isFn(p, COS) || isFn(p, TAN)) && Find(cadr(p), X)
  );
  return t && slope(cadr(t), X) ? cadr(t) : undefined;
}

function substTrig(F: U, q: U, sin: U, cos: U, tan: U): U {
  const at = (name: string) => makeList(symbol(name), q);
  return subst(subst(subst(F, at(SIN), sin), at(COS), cos), at(TAN), tan);
}

// rationalize() leaves the fractions inside a denominator: bottom-up, and
// unexpanded, or Eval distributes each numerator over its denominator again
function together(p: U): U {
  return iscons(p)
    ? rationalize(noexpand(Eval, makeList(car(p), ...p.tail().map(together))))
    : p;
}

const MAX_DEGREE = 8;

// N/D in lowest terms, undefined unless both are polynomials in u of a
// degree the partial fractions can take
function lowestTerms(N: U, D: U, u: U): U | undefined {
  [N, D] = [N, D].map((p) => doexpand(Eval, p));
  const isPoly = (p: U) =>
    !Find(p, u) || (ispolyexpandedform(p, u) && coeff(p, u).length <= MAX_DEGREE + 1);
  if (!isPoly(N) || !isPoly(D)) {
    return undefined;
  }
  const g = gcd(N, D);
  return Find(g, u) ? divide(divpoly(N, g, u), divpoly(D, g, u)) : divide(N, D);
}

// A rational function of tan(q), sin(q)^2, cos(q)^2 and sin(q)*cos(q) (it
// has the period pi), q linear in X: u = tan(q), sin = u*c, cos = c,
// c^2 = 1/(1+u^2), dX = du/(q'*(1+u^2)). Numerator and denominator are
// either both even or both odd in c; if odd, both are multiplied by c.
function tanSubstitution(F: U, X: U, depth: number): U | undefined {
  const q = trigArgument(F, X);
  if (!q) {
    return undefined;
  }
  const u = usr_symbol('integral_t');
  const c = usr_symbol('integral_c');
  const G = together(substTrig(F, q, multiply(u, c), c, u));
  if (Find(G, X)) {
    return undefined;
  }
  const w = add(Constants.one, power(u, integer(2)));
  const inU = (p: U) =>
    doexpand(Eval, evenPowers(doexpand(Eval, p), c, power(w, Constants.negOne)));
  let [N, D] = [numerator(G), denominator(G)].map(inU);
  if (Find(N, c) || Find(D, c)) {
    [N, D] = [numerator(G), denominator(G)].map((p) => inU(multiply(p, c)));
  }
  if (Find(N, c) || Find(D, c)) {
    return undefined;
  }
  const H = together(divide(N, multiply(D, multiply(slope(q, X), w))));
  const R = lowestTerms(numerator(H), denominator(H), u);
  const I = R && tryIntegral(R, u, depth);
  return I && backSubstitute(I, u, makeList(symbol(TAN), q), q);
}

// Any rational function of sin(q), cos(q), tan(q), q linear in X:
// t = tan(q/2), sin = 2*t/(1+t^2), cos = (1-t^2)/(1+t^2), dX = 2*dt/(q'*(1+t^2))
function weierstrass(F: U, X: U, depth: number): U | undefined {
  const q = trigArgument(F, X);
  if (!q) {
    return undefined;
  }
  const t = usr_symbol('integral_t');
  const t2 = power(t, integer(2));
  const w = add(Constants.one, t2);
  const sin = divide(multiply(integer(2), t), w);
  const tan = divide(multiply(integer(2), t), subtract(Constants.one, t2));
  const G = substTrig(F, q, sin, divide(subtract(Constants.one, t2), w), tan);
  if (Find(G, X)) {
    return undefined;
  }
  const H = together(divide(multiply(integer(2), G), multiply(slope(q, X), w)));
  const R = lowestTerms(numerator(H), denominator(H), t);
  const I = R && tryIntegral(R, t, depth);
  const half = divide(q, integer(2));
  return I && backSubstitute(I, t, makeList(symbol(TAN), half), half);
}

// u = tan(angle) again: arctan(u) is the angle itself (up to a constant on
// each interval between the poles), and every log gets a readable argument
function backSubstitute(I: U, u: U, tan: U, angle: U): U {
  const terms = isadd(I) ? I.tail() : [I];
  const split = terms.reduce((acc: U, term: U) => add(acc, splitLog(term, u)), Constants.zero);
  return Eval(subst(subst(split, makeList(symbol(ARCTAN), u), angle), u, tan));
}

// c*log(N/D) = c*log|N| - c*log|D| up to a constant, where N and D lose
// their numeric content; c*arctanh(w) = c/2*log((1+w)/(1-w)) is only real
// for |w| < 1, the logs of the absolute values everywhere
function splitLog(term: U, u: U): U {
  const fs = factorsOf(term);
  const withU = fs.filter((f) => Find(f, u));
  const L = withU[0];
  if (withU.length !== 1 || !(isFn(L, LOG) || isFn(L, ARCTANH))) {
    return term;
  }
  let c = product(fs.filter((f) => f !== L));
  let w = cadr(L);
  if (isFn(L, ARCTANH)) {
    c = divide(c, integer(2));
    w = divide(add(Constants.one, w), subtract(Constants.one, w));
  }
  w = together(w);
  const part = (p: U): U => {
    p = primitivePart(isFn(p, ABS) ? cadr(p) : p, u);
    return !Find(p, u) ? Constants.zero : logarithm(isPositive(p) === true ? p : abs(p));
  };
  return multiply(c, subtract(part(numerator(w)), part(denominator(w))));
}

// 6*u+2 becomes 3*u+1, sqrt(2)*u-2 becomes u-sqrt(2), -u+2 becomes u-2
function primitivePart(p: U, u: U): U {
  if (!Find(p, u) || !ispolyexpandedform(p, u)) {
    return p;
  }
  const k = coeff(p, u);
  const lead = k[k.length - 1];
  let g = k.every((n) => isrational(n)) ? k.reduce(gcd) : lead;
  if (isnegativeterm(lead) !== isnegativeterm(g)) {
    g = negate(g);
  }
  return doexpand(Eval, divide(p, g));
}

// tan(u)^2 = 1/cos(u)^2 - 1
function tanSquared(F: U, X: U, depth: number): U | undefined {
  const t = findWhere(F, (p) => ispower(p) && isFn(cadr(p), TAN) && equal(caddr(p), integer(2)));
  if (!t) {
    return undefined;
  }
  const u = cadr(cadr(t));
  const G = Eval(subst(F, t, subtract(power(makeList(symbol(COS), u), integer(-2)), Constants.one)));
  return tryIntegral(G, X, depth);
}

function findWhere(p: U, pred: (q: U) => boolean): U | undefined {
  if (!iscons(p)) {
    return undefined;
  }
  if (pred(p)) {
    return p;
  }
  for (const el of p.tail()) {
    const found = findWhere(el, pred);
    if (found) {
      return found;
    }
  }
  return undefined;
}

// F = h(g(X))*g'(X): integral of h(u) at u = g. g runs over the
// subexpressions of F containing X, plus sin(X) and cos(X) for odd trig
// powers, where the even powers of the other function become 1-u^2.
function bySubstitution(F: U, X: U, depth: number): U | undefined {
  const u = usr_symbol('integral_u');
  for (const g of candidates(F, X)) {
    const dg = derivative(g, X);
    if (isZeroAtomOrTensor(dg)) {
      continue;
    }
    const ratio = Eval(divide(F, dg));
    let h = subst(ratio, g, u);
    if (ispower(g) && cadr(g) === symbol(E)) {
      // 1/exp(p) is kept as exp(-p)
      h = subst(h, power(symbol(E), negate(caddr(g))), power(u, Constants.negOne));
    }
    if (Find(h, X) && isFn(g, SIN)) {
      h = evenPowers(h, makeList(symbol(COS), X), oneMinusSquare(u));
    } else if (Find(h, X) && isFn(g, COS)) {
      h = evenPowers(h, makeList(symbol(SIN), X), oneMinusSquare(u));
    }
    if (Find(h, X)) {
      continue;
    }
    const I = tryIntegral(Eval(h), u, depth);
    if (I !== undefined) {
      return subst(I, u, g);
    }
  }
  return undefined;
}

function candidates(F: U, X: U): U[] {
  const acc: U[] = [];
  const walk = (p: U, root: boolean) => {
    if (!iscons(p) || !Find(p, X)) {
      return;
    }
    if (!root && !acc.some((q) => equal(q, p))) {
      acc.push(p);
    }
    p.tail().forEach((el) => walk(el, false));
  };
  walk(F, true);
  if (Find(F, symbol(SIN)) || Find(F, symbol(COS))) {
    for (const fn of [SIN, COS]) {
      const t = makeList(symbol(fn), X);
      if (!acc.some((q) => equal(q, t))) {
        acc.push(t);
      }
    }
  }
  return acc;
}

function oneMinusSquare(u: U): U {
  return subtract(Constants.one, power(u, integer(2)));
}

// fn^(2k) becomes square^k
function evenPowers(p: U, fn: U, square: U): U {
  if (!iscons(p)) {
    return p;
  }
  if (ispower(p) && equal(cadr(p), fn) && iseveninteger(caddr(p))) {
    return power(square, divide(caddr(p), integer(2)));
  }
  return makeList(...p.map((el) => evenPowers(el, fn, square)));
}

// Integration by parts, u chosen by LIATE: a log, inverse trig or erf
// factor, else a power of X against the rest (exp, trig, ...). With u = X^n
// the smallest power that makes the rest integrable is taken, so that
// x^2*exp(-x^2) becomes x times x*exp(-x^2).
function byParts(F: U, X: U, depth: number): U | undefined {
  const fs = factorsOf(F).filter((f) => Find(f, X));
  const isL = (f: U): boolean =>
    [LOG, ARCSIN, ARCCOS, ARCTAN, ERF].some((n) => isFn(f, n)) ||
    (ispower(f) && isL(cadr(f)) && isposint(caddr(f)));
  const L = fs.filter(isL);
  const rest = fs.filter((f) => !isL(f));
  if (L.length === 1) {
    return parts(L[0], product(rest), X, depth);
  }
  if (L.length > 0) {
    return undefined;
  }
  const P = fs.filter((f) => ispolyexpandedform(f, X));
  const others = fs.filter((f) => !ispolyexpandedform(f, X));
  if (P.length === 0 || others.length === 0) {
    return undefined;
  }
  const n = coeff(product(P), X).length - 1;
  for (let k = 1; k <= n; k++) {
    const r = parts(
      power(X, integer(k)),
      multiply(divide(product(P), power(X, integer(k))), product(others)),
      X,
      depth
    );
    if (r !== undefined) {
      return r;
    }
  }
  return undefined;
}

function product(fs: U[]): U {
  return fs.reduce(multiply, Constants.one);
}

// u*v - integral(v*u')
function parts(u: U, dv: U, X: U, depth: number): U | undefined {
  const v = tryIntegral(dv, X, depth);
  if (v === undefined) {
    return undefined;
  }
  const J = tryIntegral(Eval(multiply(v, derivative(u, X))), X, depth);
  return J === undefined ? undefined : subtract(multiply(u, v), J);
}
