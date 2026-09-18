import {
  caddddr,
  cadddr,
  caddr,
  cadr,
  Constants,
  INF,
  isadd,
  iscons,
  ispower,
  isdouble,
  isfactorial,
  ismultiply,
  isNumericAtom,
  isrational,
  issymbol,
  Num,
  PI,
  SECRETX,
  U
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { stop } from '../runtime/run';
import {
  collectUserSymbols,
  get_binding,
  set_binding,
  symbol,
  usr_symbol
} from '../runtime/symbol';
import { add, subtract } from './add';
import { integer, nativeInt, rational } from './bignum';
import { coeff } from './coeff';
import { Eval, evaluate_integer } from './eval';
import { factorpoly } from './factorpoly';
import {
  equaln,
  isinteger,
  isnegativenumber,
  isposint,
  ispolyexpandedform,
  ispolyfactoredorexpandedform,
  isZeroAtomOrTensor
} from './is';
import { apart } from './expand';
import { denominator } from './denominator';
import { numerator } from './numerator';
import { logarithm } from './log';
import { derivative } from './derivative';
import { evalExactly, zzfloat } from './float';
import { zeta } from './zeta';
import { divide, multiply, negate } from './multiply';
import { power } from './power';
import { simplify } from './simplify';
import { subst } from './subst';
import { makeList } from './list';
import { checkArgCount, equal, exponential, yyexpand } from './misc';
import { isInteger, isPositive } from './assume';
import { binomial } from './binomial';
import { limit } from './limit';
import { rationalize } from './rationalize';
import { gosper } from './sum_gosper';

// 'sum' function

//define A p3
//define B p4
//define I p5
//define X p6

// leaves the sum at the top of the stack
export function Eval_sum(p1: U) {
  // exact even inside float(): a float inf bound would never end the loop
  return evalExactly(evalSum, p1);
}

function evalSum(p1: U): U {
  checkArgCount(p1, 4);
  // 1st arg
  const body = cadr(p1);

  // 2nd arg (index)
  const indexVariable = caddr(p1);
  if (!issymbol(indexVariable)) {
    stop('sum: 2nd arg?');
  }

  // 3rd arg (lower limit), 4th arg (upper limit)
  const j = evaluate_integer(cadddr(p1));
  const k = evaluate_integer(caddddr(p1));
  if (isNaN(j) || isNaN(k)) {
    return symbolicSum(p1, body, indexVariable);
  }

  // remember contents of the index
  // variable so we can put it back after the loop
  const p4 = get_binding(indexVariable);

  let temp: U = Constants.zero;
  try {
    for (let i = j; i <= k; i++) {
      set_binding(indexVariable, integer(i));
      temp = add(temp, Eval(body));
    }
  } finally {
    // put back the index variable to original content,
    // also when the body stops with an error
    set_binding(indexVariable, p4);
  }
  return temp;
}

// Closed form for a symbolic bound. The summand is split into its additive
// terms: the polynomial ones (in the index) are summed with power sums, every
// other term must be geometric. Anything else is returned unevaluated. As in
// other CAS, the formula is given without knowing whether b >= a.
function symbolicSum(p1: U, body: U, x: U): U {
  // the index must be unbound while the summand is taken apart
  const saved = get_binding(x);
  set_binding(x, x);
  try {
    const f = Eval(body);
    const a = Eval(cadddr(p1));
    const b = Eval(caddddr(p1));
    // numeric bounds that are not integers: the closed forms below assume
    // integer steps from a to b, sum(k,k,1/2,3) is not F(3) - F(-1/2)
    if ([a, b].some((p) => isNumericAtom(p) && isNaN(nativeInt(p)))) {
      return p1;
    }
    if (hasIntegerPole(f, x, a)) {
      stop('divide by zero');
    }
    const row = binomialRow(f, x, a, b);
    if (row) {
      return row;
    }
    let terms = isadd(f) ? f.tail() : [f];
    const isPoly = (t: U) => !Find(t, x) || ispolyexpandedform(t, x);
    if (b === symbol(INF)) {
      return infiniteSum(p1, terms, x, a);
    }

    // rational terms are summed together: their partial fractions may telescope
    const rationalTerms = terms.filter((t) => !isPoly(t) && isRationalIn(t, x));
    let telescoped: U = Constants.zero;
    if (rationalTerms.length > 0) {
      const r = telescope(rationalTerms.reduce(add, Constants.zero), x, a, b);
      if (r !== null) {
        telescoped = r;
        terms = terms.filter((t) => !rationalTerms.includes(t));
        if (terms.length === 0) {
          return telescoped;
        }
      }
    }

    let result = polynomialSum(
      terms.filter(isPoly).reduce(add, Constants.zero),
      x,
      a,
      b
    );
    // term by term, and the terms together when one has no closed form of
    // its own: (k+1)! - k!
    const rest = terms.filter((t) => !isPoly(t));
    const closed = rest.map(
      (t) => geometricSum(t, x, a, b) || gosperSum(t, x, a, b)
    );
    if (closed.every((g) => g)) {
      return closed.reduce(add, add(telescoped, result));
    }
    const together =
      rest.length > 1 && gosperSum(rest.reduce(add, Constants.zero), x, a, b);
    return together ? add(add(telescoped, result), together) : p1;
  } finally {
    set_binding(x, saved);
  }
}

// A factorial over the index and a symbol of the limits, as in
// binomial(n,k) summed up to n: the antidifference of Gosper's algorithm has
// poles there, (-1)^k*binomial(n,k) would come out as 0 also for n = 0.
function mixesIndexAndLimits(t: U, x: U, limits: U[]): boolean {
  const syms: U[] = [];
  limits.forEach((l) => collectUserSymbols(l, syms));
  const mixes = (p: U): boolean =>
    iscons(p) &&
    ((isfactorial(p) && Find(p, x) && syms.some((v) => Find(p, v))) ||
      p.tail().some(mixes));
  return mixes(t);
}

function hasFactorial(p: U): boolean {
  return iscons(p) && (isfactorial(p) || p.tail().some(hasFactorial));
}

// Gosper's antidifference; a summand that stops somewhere on the way has none
function antidifference(t: U, x: U, limits: U[]): U | null {
  if (mixesIndexAndLimits(t, x, limits)) {
    return null;
  }
  try {
    return gosper(t, x);
  } catch (e) {
    return null;
  }
}

// sum_{x=a}^{b} t = z(b+1) - z(a) for the antidifference z of Gosper
function gosperSum(t: U, x: U, a: U, b: U): U | null {
  const z = antidifference(t, x, [a, b]);
  const lower = z && lowerValue(z, t, x, a);
  return (
    lower &&
    subtract(simplify(Eval(subst(z, x, add(b, Constants.one)))), lower)
  );
}

// z(a), or z(a+1) - t(a) where z(a) runs into the factorial of a negative
// integer: x!/(6*(x-3)!) at x = 2 is 0, but not for the evaluator
function lowerValue(z: U, t: U, x: U, a: U): U | null {
  const at = (p: U, v: U) => simplify(Eval(subst(p, x, v)));
  const hasPole = (p: U): boolean =>
    iscons(p) &&
    ((isfactorial(p) && isnegativenumber(cadr(p))) || p.tail().some(hasPole));
  const direct = at(z, a);
  if (!hasPole(direct)) {
    return direct;
  }
  const next = subtract(at(z, add(a, Constants.one)), at(t, a));
  return hasPole(next) ? null : next;
}

// sum_{x=a}^{inf} t = lim z - z(a). With t(x+1)/t(x) -> rho, abs(rho) < 1,
// t decays geometrically and so does z, a rational multiple of t; for
// rho = 1 the limit of z is tried, a symbolic rho (x^k) is left alone.
function gosperSeries(t: U, x: U, a: U): Series {
  const z = antidifference(t, x, [a]);
  if (!z) {
    return null;
  }
  const next = Eval(subst(t, x, add(x, Constants.one)));
  // limit() does not come back from quotients of factorials
  const atInf = (p: U): U | null => {
    try {
      return hasFactorial(p) ? null : limit(p, x, symbol(INF));
    } catch (e) {
      return null; // no limit found
    }
  };
  const rho = atInf(simplify(divide(next, t)));
  const size = !rho
    ? NaN
    : Find(rho, symbol(INF))
    ? Infinity
    : Math.abs(toNumber(rho));
  if (size > 1) {
    return DIVERGES;
  }
  const end = size < 1 ? Constants.zero : size === 1 ? atInf(z) : null;
  if (!end || Find(end, symbol(INF)) || Find(end, x)) {
    return null;
  }
  const lower = lowerValue(z, t, x, a);
  return lower && subtract(end, lower);
}

// The whole row of binomial coefficients, from the binomial theorem
//   sum_{x=0}^{b} binomial(b,x)*y^x = (1+y)^b
// and theta = y*d/dy, which multiplies the summand by x:
//   sum p(x)*r^x*binomial(b,x) = p(theta) (1+y)^b at y = r,
// and sum binomial(b,x)^2 = binomial(2*b,b). For r = -1 the row adds up to
// 0^b, which is 0 only for an integer b >= 1. Terms that a lower limit
// above 0 skips are subtracted.
function binomialRow(f: U, x: U, a: U, b: U): U | null {
  const from = nativeInt(a);
  if (
    b === symbol(INF) ||
    isNumericAtom(b) ||
    !(from >= 0 && from <= MAX_SKIPPED) ||
    !hasFactorial(f)
  ) {
    return null;
  }
  // only for a summand of the right shape: 1/x has no value at 0
  const head = () => {
    let acc: U = Constants.zero;
    for (let j = 0; j < from; j++) {
      acc = add(acc, Eval(subst(f, x, integer(j))));
    }
    return acc;
  };
  const row = binomial(b, x);
  const q = simplify(divide(f, row));
  const square = simplify(divide(q, row));
  if (!Find(square, x)) {
    return subtract(
      multiply(square, binomial(multiply(integer(2), b), b)),
      head()
    );
  }

  // q = p(x)*r^x: r is the limit of q(x+1)/q(x)
  const ratio = rationalize(
    simplify(divide(Eval(subst(q, x, add(x, Constants.one))), q))
  );
  const parts = [numerator(ratio), denominator(ratio)].map(yyexpand);
  if (parts.some((p) => Find(p, x) && !ispolyexpandedform(p, x))) {
    return null;
  }
  const [cn, cd] = parts.map((p) => coeff(p, x));
  if (cn.length !== cd.length) {
    return null;
  }
  const r = simplify(divide(cn[cn.length - 1], cd[cd.length - 1]));
  // (1/2)^x is not combined with 2^x: r^x is also divided out as n^x/d^x
  const p = [
    power(r, x),
    divide(power(numerator(r), x), power(denominator(r), x))
  ]
    .map((rx) => yyexpand(simplify(divide(q, rx))))
    .find((p) => !Find(p, x) || ispolyexpandedform(p, x));
  if (!p) {
    return null;
  }
  if (isZeroAtomOrTensor(simplify(add(r, Constants.one)))) {
    return !Find(p, x) && isPositive(b) && isInteger(b) ? negate(head()) : null;
  }
  const y = symbol(SECRETX);
  let g: U = power(add(Constants.one, y), b);
  let total: U = Constants.zero;
  for (const c of coeff(p, x)) {
    total = add(total, multiply(c, g));
    g = multiply(y, derivative(g, y));
  }
  return subtract(simplify(Eval(subst(total, y, r))), head());
}

// sum_{i=a}^{b} f(i) = F(b) - F(a-1), with F built from power sums.
function polynomialSum(f: U, x: U, a: U, b: U): U {
  const c = coeff(f, x);
  const upper = powerSums(b, c.length - 1);
  const lower = powerSums(subtract(a, Constants.one), c.length - 1);
  return c.reduce(
    (acc: U, cp, p) => add(acc, multiply(cp, subtract(upper[p], lower[p]))),
    Constants.zero
  );
}

// A term is geometric when t(x+1)/t(x) is free of x; the sum is then
// t(a) * (r^(b-a+1) - 1) / (r - 1). Returns null for any other term.
function geometricSum(t: U, x: U, a: U, b: U): U | null {
  const next = Eval(subst(t, x, add(x, Constants.one)));
  const r = simplify(divide(next, t));
  if (Find(r, x) || equaln(r, 1)) {
    return null;
  }
  const count = add(subtract(b, a), Constants.one);
  return simplify(
    divide(
      multiply(
        Eval(subst(t, x, a)),
        subtract(power(r, count), Constants.one)
      ),
      subtract(r, Constants.one)
    )
  );
}

// S[p] = sum_{i=1}^{n} i^p for p = 0..maxP, from the telescoping identity
// (n+1)^(p+1) - 1 = sum_{j=0}^{p} C(p+1,j) * S[j].
// ponytail: binomials as JS numbers, exact up to degree ~50; bigint if needed
function powerSums(n: U, maxP: number): U[] {
  const S: U[] = [];
  for (let p = 0; p <= maxP; p++) {
    let t = subtract(
      power(add(n, Constants.one), integer(p + 1)),
      Constants.one
    );
    let binom = 1; // C(p+1, j)
    for (let j = 0; j < p; j++) {
      t = subtract(t, multiply(integer(binom), S[j]));
      binom = (binom * (p + 1 - j)) / (j + 1);
    }
    S.push(divide(t, integer(p + 1)));
  }
  return S;
}

// a value, null when there is no closed form, or the series diverges
const DIVERGES = 'diverges';
type Series = U | null | typeof DIVERGES;

// sum_{x=a}^{inf}: the polynomial and rational terms are summed together,
// each other term must be geometric (t(a)/(1-r)), an exponential series
// c*r^x/x! (c*exp(r)) or have an antidifference. Divergence is judged on the
// whole summand: one divergent part among convergent ones makes the series
// diverge, next to a part without closed form it says nothing, 1/x and
// -log(1+1/x) add up to Euler's constant.
function infiniteSum(p1: U, terms: U[], x: U, a: U): U {
  const isRational = (t: U) =>
    !Find(t, x) || ispolyexpandedform(t, x) || isRationalIn(t, x);
  const parts = terms
    .filter((t) => !isRational(t) && !isZeroAtomOrTensor(t))
    .map((t) => ({ t, g: infiniteTerm(t, x, a) || gosperSeries(t, x, a) }));
  const R = terms.filter(isRational).reduce(add, Constants.zero);
  if (!isZeroAtomOrTensor(R)) {
    parts.push(...rationalSeries(R, x, a));
  }
  if (parts.some((p) => p.g === null)) {
    return p1;
  }
  const result = parts.reduce(
    (acc: U, p) => (p.g === DIVERGES ? acc : add(acc, p.g)),
    Constants.zero
  );
  const divergent = parts.filter((p) => p.g === DIVERGES).map((p) => p.t);
  if (divergent.length > 1) {
    // 2^x - 2^(x+1)/2: parts the evaluator did not combine may cancel.
    // ponytail: parts that simplify keeps apart are taken to grow differently
    // (x, 1/x, 2^x, x!), so their sum diverges as well
    const D = simplify(divergent.reduce(add, Constants.zero));
    const left = isadd(D) ? D.tail() : [D];
    if (isZeroAtomOrTensor(D)) {
      return result;
    }
    if (left.length < divergent.length) {
      const rest = infiniteSum(p1, left, x, a);
      return rest === p1 ? p1 : add(result, rest);
    }
  }
  if (divergent.length > 0) {
    stop('sum: the series diverges');
  }
  return result;
}

// A rational summand converges when the degree of its denominator exceeds
// the degree of the numerator by 2 or more, whatever its partial fractions
// do one by one: 1/(x*(2*x+1)) = 1/x - 2/(2*x+1). Then the partial fractions
// with a simple pole are summed together, the others one by one as p-series
// c/x^s through zeta.
function rationalSeries(R: U, x: U, a: U): { t: U; g: Series }[] {
  const q = rationalize(R);
  const degree = (p: U) => coeff(yyexpand(p), x).length - 1;
  if (degree(denominator(q)) - degree(numerator(q)) < 2) {
    return [{ t: R, g: DIVERGES }];
  }
  const P = apart(R, x);
  const fractions = isadd(P) ? P.tail() : [P];
  const simple = fractions.filter((t) => degree(denominator(t)) === 1);
  const parts = fractions
    .filter((t) => !simple.includes(t))
    .map((t) => {
      const g = Find(t, x) ? infiniteTerm(t, x, a) || gosperSeries(t, x, a) : null;
      return { t, g: g === DIVERGES ? null : g };
    });
  if (simple.length > 0) {
    const t = simple.reduce(add, Constants.zero);
    parts.push({ t, g: telescope(t, x, a, symbol(INF)) });
  }
  return parts;
}

// more terms than this are not subtracted from a known series
const MAX_SKIPPED = 1000;

function infiniteTerm(t: U, x: U, a: U): Series {
  const at = (v: U) => Eval(subst(t, x, v));
  const next = at(add(x, Constants.one));
  // the terms below the lower bound, for series known from 0 or 1 on
  const skipped = (from: number): U | null => {
    const n = nativeInt(a);
    if (isNaN(n) || n < from || n - from > MAX_SKIPPED) {
      return null;
    }
    let acc: U = Constants.zero;
    for (let j = from; j < n; j++) {
      acc = add(acc, at(integer(j)));
    }
    return acc;
  };

  const r = simplify(divide(next, t));
  if (!Find(r, x)) {
    const f = zzfloat(r);
    if (isdouble(f) && Math.abs(f.d) >= 1) {
      return DIVERGES;
    }
    return simplify(divide(at(a), subtract(Constants.one, r)));
  }

  // t(x+1)/t(x) = q/(x+1): c*q^x/x!
  const q = simplify(multiply(r, add(x, Constants.one)));
  if (!Find(q, x)) {
    const head = skipped(0);
    return head && subtract(multiply(at(Constants.zero), exponential(q)), head);
  }

  // (-1)^x*c/x^s = -c*eta(s), eta(1) = log(2), eta(s) = (1-2^(1-s))*zeta(s)
  // the factor (-1)^(x+c), c an integer, is (-1)^c*(-1)^x
  const alternating = findSign(t, x);
  if (alternating !== undefined) {
    const u = simplify(divide(t, alternating));
    const su = simplify(negate(divide(multiply(x, derivative(u, x)), u)));
    const cu = isposint(su) ? simplify(multiply(u, power(x, su))) : x;
    const head = skipped(1);
    const shift = Eval(power(Constants.negOne, subtract(caddr(alternating), x)));
    if (findSign(u, x) === undefined && isNumericAtom(shift) && Find(cu, x)) {
      const g = leibniz(yyexpand(simplify(divide(Constants.one, u))), x, a);
      return g && multiply(shift, g);
    }
    if (findSign(u, x) !== undefined || Find(cu, x) || !head || !isNumericAtom(shift)) {
      return null;
    }
    const eta = equaln(su, 1)
      ? logarithm(integer(2))
      : multiply(
          subtract(Constants.one, power(integer(2), subtract(Constants.one, su))),
          zeta(su)
        );
    return subtract(negate(multiply(multiply(shift, cu), eta)), head);
  }

  // c/x^s: s = -x*t'/t
  const s = simplify(negate(divide(multiply(x, derivative(t, x)), t)));
  if (isposint(s)) {
    if (equaln(s, 1)) {
      return DIVERGES;
    }
    const c = simplify(multiply(t, power(x, s)));
    const head = skipped(1);
    return head && !Find(c, x) ? subtract(multiply(c, zeta(s)), head) : null;
  }
  return null;
}

// sum_{x=a}^{inf} (-1)^x/(c1*x+c0) with 2*c0/c1 an integer, shifted to the
// alternating harmonic series -log(2) = sum_{j>=1} (-1)^j/j (c0/c1 = s) or to
// the Leibniz series pi/4 = sum_{j>=0} (-1)^j/(2*j+1) (c0/c1 = s + 1/2):
// j = x + s, and the terms below j = a + s are subtracted.
function leibniz(inverse: U, x: U, a: U): U | null {
  if (!ispolyexpandedform(inverse, x)) {
    return null;
  }
  const c = coeff(inverse, x);
  const twice = c.length === 2 ? nativeInt(simplify(divide(multiply(integer(2), c[0]), c[1]))) : NaN;
  const from = nativeInt(a);
  if (isNaN(twice) || isNaN(from)) {
    return null;
  }
  const odd = twice % 2 !== 0;
  const s = Math.floor(twice / 2);
  const first = odd ? 0 : 1;
  if (from + s < first || from + s > MAX_SKIPPED) {
    return null;
  }
  const term = (j: number) =>
    divide(integer(j % 2 === 0 ? 1 : -1), integer(odd ? 2 * j + 1 : j));
  let series: U = odd
    ? divide(symbol(PI), integer(4))
    : negate(logarithm(integer(2)));
  for (let j = first; j < from + s; j++) {
    series = subtract(series, term(j));
  }
  return divide(
    multiply(integer((s % 2 === 0 ? 1 : -1) * (odd ? 2 : 1)), series),
    c[1]
  );
}

// the factor (-1)^g of t with g = x + constant
function findSign(t: U, x: U): U | undefined {
  if (!iscons(t)) {
    return undefined;
  }
  if (
    ispower(t) &&
    equal(cadr(t), Constants.negOne) &&
    equaln(derivative(caddr(t), x), 1)
  ) {
    return t;
  }
  for (const q of t.tail()) {
    const r = findSign(q, x);
    if (r !== undefined) {
      return r;
    }
  }
  return undefined;
}

function isRationalIn(t: U, x: U): boolean {
  const isPoly = (p: U) => !Find(p, x) || ispolyfactoredorexpandedform(p, x);
  return Find(denominator(t), x) && isPoly(numerator(t)) && isPoly(denominator(t));
}

// sum_{x=a}^{b} R(x) for a rational R whose partial fractions are all
// c/(x+m) with numbers m: within a group of poles that differ by integers
//   sum 1/(x+m0+d) = H(b+m0) - H(a+m0-1)
//                    + sum_{j=1..d} 1/(b+m0+j) - sum_{j=1..d} 1/(a+m0-1+j),
// so the harmonic parts cancel when the coefficients of the group add up to
// 0 and a finite number of terms is left. With b = inf the terms in b vanish,
// and the groups that do not add up to 0 (the caller has checked that the
// series converges, so all of them together do) give
//   sum_{x>=a} sum_i c_i/(x+m_i) = -sum_i c_i*digamma(a+m_i),
// exactly where digamma is known up to Euler's constant, which drops out.
// null when R has another shape.
function telescope(R: U, x: U, a: U, b: U): U | null {
  const infinite = b === symbol(INF);
  const P = apart(R, x);
  const fractions: { c: U; m: Num }[] = [];
  for (const part of isadd(P) ? P.tail() : [P]) {
    const k = coeff(denominator(part), x);
    const num = numerator(part);
    if (k.length !== 2 || Find(num, x)) {
      return null;
    }
    const m = divide(k[0], k[1]);
    if (!isrational(m)) {
      return null;
    }
    fractions.push({ c: divide(num, k[1]), m });
  }
  const frac = (m: Num) => subtract(m, integer(Math.floor(toNumber(m))));
  let result: U = Constants.zero;
  const done: U[] = [];
  const loose: { c: U; m: Num }[] = [];
  for (const f of fractions) {
    const key = frac(f.m);
    if (done.some((d) => equal(d, key))) {
      continue;
    }
    done.push(key);
    const group = fractions.filter((g) => equal(frac(g.m), key));
    const total = group.reduce((acc: U, g) => add(acc, g.c), Constants.zero);
    if (!isZeroAtomOrTensor(simplify(total))) {
      if (!infinite) {
        return null;
      }
      loose.push(...group);
      continue;
    }
    const m0 = group.reduce((min, g) => (toNumber(g.m) < toNumber(min) ? g.m : min), group[0].m);
    for (const g of group) {
      const d = Math.round(toNumber(g.m) - toNumber(m0));
      for (let j = 1; j <= d; j++) {
        const lower = divide(g.c, add(add(subtract(a, Constants.one), m0), integer(j)));
        const upper = infinite
          ? Constants.zero
          : divide(g.c, add(add(b, m0), integer(j)));
        result = add(result, subtract(upper, lower));
      }
    }
  }
  if (loose.length === 0) {
    return result;
  }
  const total = loose.reduce((acc: U, g) => add(acc, g.c), Constants.zero);
  if (!isZeroAtomOrTensor(simplify(total))) {
    return null;
  }
  const at = loose.map((g) => add(a, g.m));
  const exact = at.map(digammaPlusEuler);
  const psi = exact.every((v) => v !== null)
    ? exact
    : at.map((v) => makeList(usr_symbol('digamma'), v));
  return loose.reduce(
    (acc: U, g, i) => subtract(acc, multiply(g.c, psi[i])),
    result
  );
}

// digamma(r) + Euler's constant for r = n + p/q with q = 1, 2, 3, 4 or 6,
// from Gauss's digamma theorem
//   digamma(p/q) = -gamma - log(2*q) - pi/2*cot(pi*p/q)
//                  + 2*sum_{j<q/2} cos(2*pi*j*p/q)*log(sin(pi*j/q))
// and digamma(r+1) = digamma(r) + 1/r. null for other r and at the poles.
function digammaPlusEuler(r: U): U | null {
  if (!isrational(r)) {
    return null;
  }
  const q = nativeInt(denominator(r));
  let n = Math.floor(toNumber(r));
  let f: U = subtract(r, integer(n)); // 0 < f <= 1
  if (isZeroAtomOrTensor(f)) {
    f = Constants.one;
    n--;
  }
  if (![1, 2, 3, 4, 6].includes(q) || (q === 1 && n < 0) || Math.abs(n) > MAX_SKIPPED) {
    return null;
  }
  const log = (k: number) => logarithm(integer(k));
  const root3Pi = multiply(power(integer(3), rational(1, 2)), symbol(PI));
  const [piTerm, logs]: U[] = {
    1: [Constants.zero, Constants.zero],
    2: [Constants.zero, multiply(integer(2), log(2))],
    3: [divide(root3Pi, integer(6)), multiply(rational(3, 2), log(3))],
    4: [divide(symbol(PI), integer(2)), multiply(integer(3), log(2))],
    6: [
      divide(root3Pi, integer(2)),
      add(multiply(integer(2), log(2)), multiply(rational(3, 2), log(3)))
    ]
  }[q];
  let value = subtract(2 * toNumber(f) < 1 ? negate(piTerm) : piTerm, logs);
  for (let j = 0; j < n; j++) {
    value = add(value, divide(Constants.one, add(f, integer(j))));
  }
  for (let j = 1; j <= -n; j++) {
    value = subtract(value, divide(Constants.one, subtract(f, integer(j))));
  }
  return value;
}

// a pole of the summand at an integer from the lower limit on: the closed
// forms would step over it, 1/(x*(x+1)) from -5 on has no sum
function hasIntegerPole(f: U, x: U, a: U): boolean {
  const from = nativeInt(a);
  if (isNaN(from)) {
    return false;
  }
  // the factors of p without their numeric exponents; x^s is left alone
  const bases = (p: U): U[] =>
    (ismultiply(p) ? p.tail() : [p])
      .filter((q) => !ispower(q) || isNumericAtom(caddr(q)))
      .map((q) => (ispower(q) ? cadr(q) : q));
  const isPole = (p: U) => {
    const c = Find(p, x) && ispolyexpandedform(p, x) ? coeff(p, x) : [];
    const root = c.length === 2 && negate(divide(c[0], c[1]));
    return root && isrational(root) && isinteger(root) && toNumber(root) >= from;
  };
  return bases(denominator(f)).some((p) => {
    if (!Find(p, x) || !ispolyexpandedform(p, x)) {
      return false;
    }
    const c = coeff(p, x);
    // rational roots are linear factors; symbolic coefficients are left alone
    return c.length > 2 && c.every((k) => isrational(k))
      ? bases(factorpoly(p, x)).some(isPole)
      : isPole(p);
  });
}

function toNumber(p: U): number {
  const f = zzfloat(p);
  return isdouble(f) ? f.d : NaN;
}
