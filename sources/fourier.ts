import {
  ABS,
  caddr,
  cadddr,
  caddddr,
  cadr,
  car,
  cdr,
  CIRCEXP,
  Constants,
  COS,
  DEFINT,
  DERIVATIVE,
  DIRAC,
  E,
  INF,
  INTEGRAL,
  isadd,
  iscons,
  isdouble,
  ismultiply,
  isNumericAtom,
  istensor,
  LAPLACE,
  NIL,
  PI,
  POWER,
  SGN,
  SIN,
  SYMBOL_X,
  U,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { stop } from '../runtime/run';
import { symbol, usr_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { isNegative, isPositive, isReal } from './assume';
import { integer, nativeInt, rational } from './bignum';
import { denominator } from './denominator';
import { derivative } from './derivative';
import { Eval } from './eval';
import { apart } from './expand';
import { factorial } from './factorial';
import { evalExactly, zzfloat } from './float';
import { imag } from './imag';
import { isZeroAtomOrTensor } from './is';
import { laplace, linear } from './laplace';
import { makeList } from './list';
import { equal, exponential } from './misc';
import { divide, multiply, negate } from './multiply';
import { power } from './power';
import { numerator } from './numerator';
import { rationalize } from './rationalize';
import { real } from './real';
import { build_tensor } from './scan';
import { simplify } from './simplify';
import { subst } from './subst';

// Fourier series and Fourier transform.
//
//   fouriercoeff(f,x,k[,P])   [a_k, b_k]
//   fourierseries(f,x,n[,P])  a_0/2 + sum_{k=1..n} a_k cos(k pi x/L) + b_k sin(k pi x/L)
// with a_k = 1/L integral_a^b f cos(k pi x/L) dx, b_k the same with sin. The
// period P is [-pi,pi] when left out, a half period L for [-L,L], or an
// interval [a,b] with L = (b-a)/2.
//
//   fourier(f,x,w)    = integral_{-inf}^{inf} f(x) exp(-i w x) dx
//   invfourier(F,w,x) = 1/(2 pi) integral_{-inf}^{inf} F(w) exp(i w x) dw
// (no factor 1/sqrt(2 pi)). Table based like laplace; what no rule covers
// returns the call unevaluated.

const FOURIER = 'fourier';
const INVFOURIER = 'invfourier';

const call = (name: string, ...xs: U[]): U => Eval(makeList(symbol(name), ...xs));
const factors = (p: U): U[] => (ismultiply(p) ? p.tail() : [p]);
const terms = (p: U): U[] => (isadd(p) ? p.tail() : [p]);
const product = (ps: U[]): U => ps.reduce(multiply, Constants.one);
const sum = (ps: U[]): U => ps.reduce(add, Constants.zero);
const isexp = (p: U) => car(p) === symbol(POWER) && cadr(p) === symbol(E);
const isfn = (p: U, name: string) => iscons(p) && car(p) === symbol(name);
const pi = () => symbol(PI);
const i = () => Constants.imaginaryunit;
const minusInf = () => negate(symbol(INF));
const isInf = (p: U) => p === symbol(INF);
const isMinusInf = (p: U) => equal(p, minusInf());

// 1, 0, -1, or undefined when neither the value nor the assumptions tell
function sign3(p: U): number | undefined {
  const d = zzfloat(p);
  if (isdouble(d)) {
    return Math.sign(d.d);
  }
  return isPositive(p) ? 1 : isNegative(p) ? -1 : isZeroAtomOrTensor(p) ? 0 : undefined;
}

// ------------------------------------------------- pieces between the kinks

// the arguments u of every abs(u) and sgn(u) that depends on x
function kinks(p: U, x: U, found: U[] = []): U[] {
  if (iscons(p)) {
    if ((isfn(p, ABS) || isfn(p, SGN)) && Find(cadr(p), x) && !found.some((u) => equal(u, cadr(p)))) {
      found.push(cadr(p));
    }
    for (let q: U = p; iscons(q); q = cdr(q)) {
      kinks(car(q), x, found);
    }
  }
  return found;
}

// The zeros of u between a and b: of a linear u, or of sin/cos of a linear
// argument when everything is numeric. null: unknown.
function zeros(u: U, x: U, a: U, b: U): U[] | null {
  const lin = linear(u, x);
  if (lin) {
    return [negate(divide(lin[1], lin[0]))];
  }
  if (!isfn(u, SIN) && !isfn(u, COS)) {
    return null;
  }
  const inner = linear(cadr(u), x);
  if (!inner) {
    return null;
  }
  const [p, q] = inner;
  // p x + q = n pi + offset
  const offset = isfn(u, SIN) ? Constants.zero : divide(pi(), integer(2));
  const n = (at: U) => {
    const d = zzfloat(divide(subtract(add(multiply(p, at), q), offset), pi()));
    return isdouble(d) ? d.d : NaN;
  };
  const [n1, n2] = [n(a), n(b)].sort((u, v) => u - v);
  if (!(n2 - n1 < 200)) {
    return null; // not numeric, or too many pieces
  }
  const result: U[] = [];
  for (let k = Math.ceil(n1); k <= Math.floor(n2); k++) {
    result.push(divide(subtract(add(multiply(integer(k), pi()), offset), q), p));
  }
  return result;
}

interface Piece {
  lo: U;
  hi: U;
  f: U;
}

// f on [a,b] split at the kinks, with abs(u) and sgn(u) replaced by the
// sign of u on each piece. null when a position or a sign is unknown.
function pieces(f: U, x: U, a: U, b: U): Piece[] | null {
  const us = kinks(f, x);
  const less = (p: U, q: U) => (isMinusInf(p) || isInf(q) ? 1 : sign3(subtract(q, p)));
  let points: U[] = [];
  for (const u of us) {
    const zs = zeros(u, x, a, b);
    if (zs === null) {
      return null;
    }
    for (const z of zs) {
      const [above, below] = [less(a, z), less(z, b)];
      if (above === undefined || below === undefined) {
        return null;
      }
      if (above === 1 && below === 1 && !points.some((p) => equal(p, z))) {
        points.push(z);
      }
    }
  }
  if (points.length > 1) {
    // ponytail: several kinks are sorted by value, so they must be numbers
    const values = points.map((p) => zzfloat(p));
    if (!values.every(isdouble)) {
      return null;
    }
    points = points
      .map((p, k) => [p, (values[k] as any).d] as [U, number])
      .sort((u, v) => u[1] - v[1])
      .map((u) => u[0]);
  }
  const bounds = [a, ...points, b];
  const result: Piece[] = [];
  for (let k = 0; k + 1 < bounds.length; k++) {
    const [lo, hi] = [bounds[k], bounds[k + 1]];
    const mid = isMinusInf(lo)
      ? isInf(hi)
        ? Constants.zero
        : subtract(hi, Constants.one)
      : isInf(hi)
      ? add(lo, Constants.one)
      : divide(add(lo, hi), integer(2));
    let g = f;
    for (const u of us) {
      const s = sign3(Eval(subst(u, x, mid)));
      if (!s) {
        return null;
      }
      g = subst(g, makeList(symbol(ABS), u), multiply(integer(s), u));
      g = subst(g, makeList(symbol(SGN), u), integer(s));
    }
    result.push({ lo, hi, f: Eval(g) });
  }
  return result;
}

// defint, or null. integral() has no rule for sin(x)*cos(2*x): those go
// through exponentials; a result that stays complex counts only on request.
function integrate(f: U, x: U, a: U, b: U, complex = false): U | null {
  const attempt = (g: U) => {
    try {
      const r = call(DEFINT, g, x, a, b);
      return Find(r, symbol(INTEGRAL)) || Find(r, symbol(DEFINT)) ? null : r;
    } catch (e) {
      return null;
    }
  };
  const direct = attempt(f);
  if (direct) {
    return direct;
  }
  const viaExp = attempt(call(CIRCEXP, f));
  return viaExp && (complex || !Find(viaExp, i())) ? viaExp : null;
}

// ------------------------------------------------------------------ series

function period(P: U): [U, U] {
  const [a, b] =
    P === symbol(NIL)
      ? [negate(pi()), pi()]
      : istensor(P) && P.tensor.nelem === 2
      ? [P.tensor.elem[0], P.tensor.elem[1]]
      : [negate(P), P];
  if (isZeroAtomOrTensor(subtract(b, a))) {
    stop('fourierseries: the period must not be zero');
  }
  return [a, b];
}

// [a_k, b_k], or null
function coefficients(f: U, x: U, k: U, a: U, b: U): [U, U] | null {
  const L = divide(subtract(b, a), integer(2));
  const ps = pieces(f, x, a, b);
  if (ps === null) {
    return null;
  }
  const arg = divide(multiply(multiply(k, pi()), x), L);
  const coefficient = (name: string): U | null => {
    let total: U = Constants.zero;
    for (const p of ps) {
      const part = integrate(multiply(p.f, call(name, arg)), x, p.lo, p.hi);
      if (part === null) {
        return null;
      }
      total = add(total, part);
    }
    return divide(total, L);
  };
  const ak = coefficient(COS);
  const bk = ak && coefficient(SIN);
  return bk ? [ak, bk] : null;
}

function seriesArgs(p1: U): [U, U, U, U] {
  return [Eval(cadr(p1)), Eval(caddr(p1)), Eval(cadddr(p1)), Eval(caddddr(p1))];
}

const unevaluated = (name: string, ...xs: U[]) =>
  makeList(usr_symbol(name), ...xs.filter((p) => p !== symbol(NIL)));

export function Eval_fouriercoeff(p1: U): U {
  return evalExactly(evalFouriercoeff, p1);
}

function evalFouriercoeff(p1: U): U {
  const [f, x, k, P] = seriesArgs(p1);
  const c = coefficients(f, x, k, ...period(P));
  return c ? build_tensor(c) : unevaluated('fouriercoeff', f, x, k, P);
}

export function Eval_fourierseries(p1: U): U {
  return evalExactly(evalFourierseries, p1);
}

function evalFourierseries(p1: U): U {
  const [f, x, N, P] = seriesArgs(p1);
  const [a, b] = period(P);
  const n = nativeInt(N);
  if (!isNumericAtom(N)) {
    return unevaluated('fourierseries', f, x, N, P);
  }
  if (isNaN(n) || n < 0 || n > 200) {
    stop('fourierseries: the number of terms must be an integer from 0 to 200');
  }
  const L = divide(subtract(b, a), integer(2));
  let series: U = Constants.zero;
  for (let k = 0; k <= n; k++) {
    const c = coefficients(f, x, integer(k), a, b);
    if (c === null) {
      return unevaluated('fourierseries', f, x, N, P);
    }
    const arg = divide(multiply(multiply(integer(k), pi()), x), L);
    series = add(
      series,
      k === 0
        ? divide(c[0], integer(2))
        : add(multiply(c[0], call(COS, arg)), multiply(c[1], call(SIN, arg)))
    );
  }
  return series;
}

// --------------------------------------------------------------- transform

function transformArgs(p1: U, x: U, y: U): [U, U, U] {
  const a = Eval(caddr(p1));
  const b = Eval(cadddr(p1));
  return [Eval(cadr(p1)), a === symbol(NIL) ? x : a, b === symbol(NIL) ? y : b];
}

export function Eval_fourier(p1: U): U {
  return evalExactly((p: U) => {
    const [f, x, w] = transformArgs(p, symbol(SYMBOL_X), usr_symbol('w'));
    const F = fourier(f, x, w);
    // two shifted poles give exp(i w) - exp(-i w): a sine
    return failed(F) ? F : toTrig(F, w, true);
  }, p1);
}

export function Eval_invfourier(p1: U): U {
  return evalExactly(evalInvfourier, p1);
}

function evalInvfourier(p1: U): U {
  const [F, w, x] = transformArgs(p1, usr_symbol('w'), symbol(SYMBOL_X));
  // f(x) = 1/(2 pi) * (the transform of F, taken at -x)
  const y = usr_symbol('$y'); // the parser can't produce it
  const G = fourier(F, w, y);
  if (failed(G)) {
    return makeList(usr_symbol(INVFOURIER), F, w, x);
  }
  let f = Eval(subst(G, y, negate(x)));
  // sgn(-x-1) = -sgn(x+1)
  for (const u of kinks(f, x)) {
    const lin = linear(u, x);
    if (lin && sign3(lin[0]) === -1) {
      f = subst(f, makeList(symbol(SGN), u), negate(makeList(symbol(SGN), negate(u))));
    }
  }
  return divide(toTrig(Eval(f), x, true), multiply(integer(2), pi()));
}

// exp(i c x) as cos(c x) + i sin(c x): the pair of impulses of a cosine comes
// back as two exponentials. realOnly: kept only when that makes the whole real.
function toTrig(p: U, x: U, realOnly: boolean): U {
  // exp(i beta x + rest) with beta != 0: [beta, rest]
  const split = (q: U): [U, U] | null => {
    if (!isexp(q)) {
      return null;
    }
    const beta = sum(
      terms(caddr(q)).map((t) => {
        const lin = Find(t, x) ? linear(t, x) : null;
        return lin ? imag(lin[0]) : Constants.zero;
      })
    );
    return isZeroAtomOrTensor(beta) ? null : [beta, subtract(caddr(q), multiply(multiply(i(), beta), x))];
  };
  const found: U[] = [];
  const collect = (q: U) => {
    if (split(q)) {
      found.push(q);
    } else if (iscons(q)) {
      collect(car(q));
      q.tail().forEach(collect);
    }
  };
  collect(p);
  if (!found.length) {
    return p;
  }
  let r = p;
  for (const g of found) {
    const [beta, rest] = split(g);
    const bx = multiply(beta, x);
    r = subst(r, g, multiply(exponential(rest), add(call(COS, bx), multiply(i(), call(SIN, bx)))));
  }
  r = Eval(r);
  return realOnly && Find(r, i()) ? p : r;
}

const failed = (F: U) => Find(F, usr_symbol(FOURIER));

export function fourier(f: U, x: U, w: U): U {
  // abs, sgn and heaviside: piece by piece, the terms of
  // heaviside(x)*exp(-x) = exp(-x)/2 + sgn(x)*exp(-x)/2 have no transform
  // of their own
  const whole = kinks(f, x).length ? piecewise(f, x, w) : null;
  if (whole) {
    return whole;
  }
  const results = terms(f).map((t) => term(t, x, w));
  const bad = terms(f).filter((_, k) => failed(results[k]));
  if (bad.length > 1 && kinks(sum(bad), x).length) {
    const good = sum(results.filter((r) => !failed(r)));
    const group = piecewise(sum(bad), x, w);
    return add(good, group || makeList(usr_symbol(FOURIER), sum(bad), x, w));
  }
  return sum(results);
}

// One term: constants are pulled out. The result of a rule may hold an
// unevaluated fourier(...), as in i*d(fourier(f(x),x,w),w).
function term(t: U, x: U, w: U): U {
  if (!Find(t, x)) {
    return multiply(multiply(multiply(integer(2), pi()), t), call(DIRAC, w));
  }
  const c = product(factors(t).filter((g) => !Find(g, x)));
  const dep = factors(t).filter((g) => Find(g, x));
  const g = product(dep);
  let F = dep.length === 1 ? single(g, x, w) : null;
  if (F === null || failed(F)) {
    // a rational function: term by term over its partial fractions
    const parts = partialFractions(g, x);
    F = (parts && fourier(parts, x, w)) || F;
  }
  if (F === null || failed(F)) {
    F = productRule(dep, x, w) || F;
  }
  if ((F === null || failed(F)) && kinks(g, x).length) {
    F = piecewise(g, x, w) || F;
  }
  return multiply(c, F || makeList(usr_symbol(FOURIER), g, x, w));
}

// apart when it splits g, else null
function partialFractions(g: U, x: U): U | null {
  try {
    const parts = apart(g, x);
    return isadd(parts) ? parts : null;
  } catch (e) {
    return null;
  }
}

// n for x or x^n (n a positive integer), else 0
function xPower(g: U, x: U): number {
  if (g === x) {
    return 1;
  }
  if (car(g) === symbol(POWER) && cadr(g) === x) {
    const n = nativeInt(caddr(g));
    return n > 0 ? n : 0;
  }
  return 0;
}

// c for exp(i c x + d) with a real c, else null
function frequency(g: U, x: U): [U, U] | null {
  const lin = isexp(g) ? linear(caddr(g), x) : null;
  if (!lin) {
    return null;
  }
  const c = divide(lin[0], i());
  return isReal(c) === true ? [c, lin[1]] : null;
}

function productRule(dep: U[], x: U, w: U): U | null {
  const others = (k: number) => product(dep.filter((_, j) => j !== k));
  const shifted = (G: U, by: U) => Eval(subst(G, w, add(w, by)));

  // exp(i c x + d) g(x) -> exp(d) G(w - c)
  const e = dep.findIndex((g) => frequency(g, x));
  if (e >= 0) {
    const [c, d] = frequency(dep[e], x);
    return multiply(exponential(d), shifted(fourier(others(e), x, w), negate(c)));
  }
  // cos(c x + d) g(x) -> (exp(i d) G(w - c) + exp(-i d) G(w + c))/2,
  // sin(c x + d) g(x) -> (exp(i d) G(w - c) - exp(-i d) G(w + c))/(2 i)
  const t = dep.findIndex(
    (g) => (isfn(g, SIN) || isfn(g, COS)) && linear(cadr(g), x) && isReal(linear(cadr(g), x)[0]) === true
  );
  if (t >= 0) {
    const [c, d] = linear(cadr(dep[t]), x);
    const G = fourier(others(t), x, w);
    const plus = multiply(exponential(multiply(i(), d)), shifted(G, negate(c)));
    const minus = multiply(exponential(negate(multiply(i(), d))), shifted(G, c));
    return isfn(dep[t], COS)
      ? divide(add(plus, minus), integer(2))
      : divide(subtract(plus, minus), multiply(integer(2), i()));
  }
  // x^n g(x) -> i^n d^n/dw^n G(w)
  const p = dep.findIndex((g) => xPower(g, x) > 0);
  if (p >= 0) {
    const n = xPower(dep[p], x);
    let G = fourier(others(p), x, w);
    for (let k = 0; k < n; k++) {
      G = multiply(i(), derivative(G, w));
    }
    return G;
  }
  return null;
}

function single(g: U, x: U, w: U): U | null {
  if (xPower(g, x) > 0 || frequency(g, x) || isfn(g, SIN) || isfn(g, COS)) {
    return productRule([g], x, w);
  }

  if (car(g) === symbol(DERIVATIVE) && caddr(g) === x && cadddr(g) === symbol(NIL)) {
    // g' -> i w G(w)
    return multiply(multiply(i(), w), fourier(cadr(g), x, w));
  }

  if (isexp(g)) {
    // exp(-A x^2 + B x + C), A > 0 -> sqrt(pi/A) exp(C + (B - i w)^2/(4 A)),
    // B may be complex: shift and modulation at once
    const d1 = derivative(caddr(g), x);
    const d2 = derivative(d1, x);
    const A = divide(d2, integer(-2));
    if (Find(d2, x) || isPositive(A) !== true) {
      return null;
    }
    const at0 = (p: U) => Eval(subst(p, x, Constants.zero));
    const B = subtract(at0(d1), multiply(i(), w));
    return multiply(
      power(divide(pi(), A), rational(1, 2)),
      exponential(add(at0(caddr(g)), divide(multiply(B, B), multiply(integer(4), A))))
    );
  }

  if (car(g) === symbol(POWER) && nativeInt(caddr(g)) < 0) {
    return reciprocal(cadr(g), -nativeInt(caddr(g)), x, w);
  }

  const lin = (isfn(g, DIRAC) || isfn(g, SGN)) && linear(cadr(g), x);
  if (!lin || isReal(lin[0]) !== true) {
    return null;
  }
  // g(a x + c) = g(a (x - x0)) -> exp(-i w x0) ...
  const [a, c] = lin;
  const shift = exponential(divide(multiply(multiply(i(), w), c), a));
  if (isfn(g, DIRAC)) {
    return divide(shift, call(ABS, a));
  }
  // sgn(x) -> 2/(i w), sgn(a x) = sgn(a) sgn(x)
  const s = sign3(a);
  return s ? multiply(multiply(integer(s), shift), divide(integer(2), multiply(i(), w))) : null;
}

// 1/base^n with a polynomial base
function reciprocal(base: U, n: number, x: U, w: U): U | null {
  const at0 = (p: U) => Eval(subst(p, x, Constants.zero));
  const d1 = derivative(base, x);
  const d2 = derivative(d1, x);
  if (Find(d2, x)) {
    return null;
  }
  if (isZeroAtomOrTensor(d2)) {
    // 1/(x - x0) -> -i pi sgn(w) exp(-i w x0) for a real x0 (principal
    // value), 2 pi i exp(-i w x0) heaviside(-w) for x0 above the real axis,
    // -2 pi i exp(-i w x0) heaviside(w) below; the n-th power is the
    // (n-1)-th derivative: times (-i w)^(n-1)/(n-1)!
    const x0 = negate(divide(at0(base), d1));
    const side = sign3(imag(x0));
    if (side === undefined || (side === 0 && isReal(x0) !== true)) {
      return null;
    }
    const F =
      side === 0
        ? multiply(negate(multiply(i(), pi())), call(SGN, w))
        : multiply(
            multiply(integer(2 * side), multiply(i(), pi())),
            call('heaviside', multiply(integer(-side), w))
          );
    return divide(
      multiply(
        multiply(F, exponential(negate(multiply(multiply(i(), w), x0)))),
        power(negate(multiply(i(), w)), integer(n - 1))
      ),
      multiply(factorial(integer(n - 1)), power(d1, integer(n)))
    );
  }
  // b2 ((x - h)^2 + r^2) -> pi/(b2 r) exp(-r abs(w)) exp(-i w h), r^2 > 0
  const b2 = divide(d2, integer(2));
  const h = negate(divide(at0(d1), d2));
  const r2 = subtract(divide(at0(base), b2), multiply(h, h));
  if (n === 1 && isPositive(r2) === true && isReal(h) === true) {
    const r = power(r2, rational(1, 2));
    return multiply(
      divide(pi(), multiply(b2, r)),
      exponential(subtract(negate(multiply(r, call(ABS, w))), multiply(multiply(i(), w), h)))
    );
  }
  // any other quadratic b2 (x - r1)(x - r2), also with complex coefficients:
  // 1/((x - r1)(x - r2)) = (1/(x - r1) - 1/(x - r2))/(r1 - r2)
  if (n !== 1) {
    return null;
  }
  const pole = (r: U, order: number) => reciprocal(subtract(x, r), order, x, w);
  const q = power(negate(r2), rational(1, 2));
  if (isZeroAtomOrTensor(q)) {
    const F = pole(h, 2);
    return F && divide(F, b2);
  }
  const [F1, F2] = [pole(add(h, q), 1), pole(subtract(h, q), 1)];
  return F1 && F2 && divide(subtract(F1, F2), multiply(multiply(integer(2), q), b2));
}

// exponential decay for t -> inf: every term has a factor exp(B t + C) with
// Re B < 0 next to powers of t and sin/cos of real linear arguments
function decays(f: U, t: U): boolean {
  return terms(f).every((g) => {
    const dep = factors(g).filter((h) => Find(h, t));
    const damped = dep.some((h) => {
      const lin = isexp(h) ? linear(caddr(h), t) : null;
      return lin !== null && isNegative(real(lin[0])) === true;
    });
    return (
      damped &&
      dep.every((h) => {
        const lin = isexp(h) || isfn(h, SIN) || isfn(h, COS) ? linear(isexp(h) ? caddr(h) : cadr(h), t) : null;
        return xPower(h, t) > 0 || (lin !== null && (isexp(h) || isReal(lin[0]) === true));
      })
    );
  });
}

// The integral piece by piece between the kinks of abs and sgn: defint on a
// finite piece, the laplace transform at s = +-i w on a decaying infinite one.
function piecewise(f: U, x: U, w: U): U | null {
  const ps = pieces(f, x, minusInf(), symbol(INF));
  if (ps === null) {
    return null;
  }
  const s = usr_symbol('$s');
  const iw = multiply(i(), w);
  let total: U = Constants.zero;
  // the infinite pieces as numerator/denominator: 1/(1+i w) + 1/(1-i w)
  // only becomes 2/(1+w^2) over the common denominator
  const tails: [U, U][] = [];
  let direct: U = Constants.zero; // a single one keeps the form of the laplace table
  for (const p of ps) {
    if (isZeroAtomOrTensor(p.f)) {
      continue;
    }
    if (isMinusInf(p.lo) || isInf(p.hi)) {
      if (isMinusInf(p.lo) && isInf(p.hi)) {
        return null;
      }
      // x = lo + t, or x = hi - t: exp(-i w lo) L(i w), exp(-i w hi) L(-i w)
      const up = isInf(p.hi);
      const from = up ? p.lo : p.hi;
      const g = Eval(subst(p.f, x, up ? add(from, x) : subtract(from, x)));
      if (!decays(g, x)) {
        return null;
      }
      const L = laplace(g, x, s);
      if (Find(L, symbol(LAPLACE))) {
        return null;
      }
      const G = rationalize(L);
      const at = (q: U) => Eval(subst(q, s, up ? iw : negate(iw)));
      direct = multiply(exponential(negate(multiply(iw, from))), at(L));
      tails.push([multiply(exponential(negate(multiply(iw, from))), at(numerator(G))), at(denominator(G))]);
      continue;
    }
    const re = integrate(multiply(p.f, call(COS, multiply(w, x))), x, p.lo, p.hi);
    const im = re && integrate(multiply(p.f, call(SIN, multiply(w, x))), x, p.lo, p.hi);
    const part = im
      ? subtract(re, multiply(i(), im))
      : integrate(multiply(p.f, exponential(negate(multiply(iw, x)))), x, p.lo, p.hi, true);
    if (part === null) {
      return null;
    }
    total = add(total, im ? part : toTrig(part, w, false));
  }
  if (tails.length === 2) {
    const [[n1, d1], [n2, d2]] = tails;
    return add(total, simplify(divide(add(multiply(n1, d2), multiply(n2, d1)), multiply(d1, d2))));
  }
  return add(total, direct);
}
