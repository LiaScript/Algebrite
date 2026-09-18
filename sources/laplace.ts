import {
  caddr,
  cadddr,
  cadr,
  car,
  Constants,
  COS,
  COSH,
  DERIVATIVE,
  DIRAC,
  E,
  INVLAPLACE,
  isadd,
  ismultiply,
  LAPLACE,
  NIL,
  POWER,
  SGN,
  SIN,
  SINH,
  SYMBOL_S,
  SYMBOL_T,
  U,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { symbol, usr_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { integer, nativeInt, rational } from './bignum';
import { derivative } from './derivative';
import { Eval } from './eval';
import { apart } from './expand';
import { factorial } from './factorial';
import { isplusone, isZeroAtomOrTensor } from './is';
import { makeList } from './list';
import { checkArgCount, exponential } from './misc';
import { divide, multiply, negate } from './multiply';
import { power } from './power';
import { subst } from './subst';
import { cmp_values } from './test';

// laplace(f, t, s) and invlaplace(F, s, t), table based.
// Rules not covered return the call unevaluated, like unknown functions.

export function Eval_laplace(p1: U) {
  checkArgCount(p1, 1, 3);
  const [f, t, s] = args(p1, SYMBOL_T, SYMBOL_S);
  return laplace(f, t, s);
}

export function Eval_invlaplace(p1: U) {
  checkArgCount(p1, 1, 3);
  const [F, s, t] = args(p1, SYMBOL_S, SYMBOL_T);
  return invlaplace(F, s, t);
}

function args(p1: U, x: string, y: string): [U, U, U] {
  const a = Eval(caddr(p1));
  const b = Eval(cadddr(p1));
  return [
    Eval(cadr(p1)),
    a === symbol(NIL) ? symbol(x) : a,
    b === symbol(NIL) ? symbol(y) : b,
  ];
}

const call = (name: string, ...xs: U[]): U => Eval(makeList(symbol(name), ...xs));
const factors = (p: U): U[] => (ismultiply(p) ? p.tail() : [p]);
const product = (ps: U[]): U => ps.reduce(multiply, Constants.one);
const isexp = (p: U) => car(p) === symbol(POWER) && cadr(p) === symbol(E);

// u = a*x + c with a, c free of x, else null
function linear(u: U, x: U): [U, U] | null {
  const a = derivative(u, x);
  if (Find(a, x)) {
    return null;
  }
  return [a, Eval(subst(u, x, Constants.zero))];
}

// ---------------------------------------------------------------- laplace

function laplace(f: U, t: U, s: U): U {
  const unevaluated = makeList(symbol(LAPLACE), f, t, s);
  if (!Find(f, t)) {
    return divide(f, s);
  }
  if (isadd(f)) {
    return f.tail().reduce((acc: U, g: U) => add(acc, laplace(g, t, s)), Constants.zero);
  }

  const constant = factors(f).filter((g) => !Find(g, t));
  const dep = factors(f).filter((g) => Find(g, t));
  const c = product(constant);
  const result =
    dep.length === 1 ? single(dep[0], t, s) : productRule(dep, t, s);
  return result === null
    ? isplusone(c)
      ? unevaluated
      : multiply(c, makeList(symbol(LAPLACE), product(dep), t, s))
    : multiply(c, result);
}

// Products of t-dependent factors: shift theorem and multiplication by t^n.
function productRule(dep: U[], t: U, s: U): U | null {
  const e = dep.findIndex((g) => isexp(g) && linear(caddr(g), t));
  if (e >= 0) {
    // L{exp(a t + c) g(t)} = exp(c) G(s - a)
    const [a, c] = linear(caddr(dep[e]), t);
    const rest = product(dep.filter((_, i) => i !== e));
    const G = laplace(rest, t, s);
    return multiply(exponential(c), Eval(subst(G, s, subtract(s, a))));
  }
  const p = dep.findIndex((g) => tPower(g, t) > 0);
  if (p >= 0) {
    // L{t^n g(t)} = (-1)^n d^n/ds^n G(s)
    const n = tPower(dep[p], t);
    let G = laplace(product(dep.filter((_, i) => i !== p)), t, s);
    for (let i = 0; i < n; i++) {
      G = negate(derivative(G, s));
    }
    return G;
  }
  return null;
}

// n for t or t^n (n a positive integer), else 0
function tPower(g: U, t: U): number {
  if (g === t) {
    return 1;
  }
  if (car(g) === symbol(POWER) && cadr(g) === t) {
    const n = nativeInt(caddr(g));
    return n > 0 ? n : 0;
  }
  return 0;
}

function single(g: U, t: U, s: U): U | null {
  const n = tPower(g, t);
  if (n > 0) {
    return divide(factorial(integer(n)), power(s, integer(n + 1)));
  }

  if (car(g) === symbol(DERIVATIVE) && caddr(g) === t && cadddr(g) === symbol(NIL)) {
    // L{g'} = s G(s) - g(0)
    const inner = cadr(g);
    return subtract(multiply(s, laplace(inner, t, s)), initialValue(inner, t));
  }

  const arg = isexp(g) ? caddr(g) : cadr(g);
  const lin = linear(arg, t);
  if (lin === null) {
    return null;
  }
  let [a, c] = lin;
  const f = car(g);
  if (f === symbol(DIRAC) && cmp_values(a, Constants.zero) === -1) {
    // dirac is even: dirac(-t + 3) = dirac(t - 3)
    [a, c] = [negate(a), negate(c)];
  }

  if (isexp(g)) {
    return divide(exponential(c), subtract(s, a));
  }

  // sin/cos(a t + c) = sin/cos(a t) cos(c) +/- cos/sin(a t) sin(c)
  const trig = (sq: U, x: U, y: U) =>
    divide(add(multiply(a, x), multiply(s, y)), sq);
  const circ = add(power(s, integer(2)), power(a, integer(2)));
  const hyp = subtract(power(s, integer(2)), power(a, integer(2)));
  if (f === symbol(SIN)) {
    return trig(circ, call(COS, c), call(SIN, c));
  }
  if (f === symbol(COS)) {
    return trig(circ, negate(call(SIN, c)), call(COS, c));
  }
  if (f === symbol(SINH)) {
    return trig(hyp, call(COSH, c), call(SINH, c));
  }
  if (f === symbol(COSH)) {
    return trig(hyp, call(SINH, c), call(COSH, c));
  }

  // sgn(a t + c) = sgn(t - t0) for a > 0, t0 = -c/a >= 0:
  // L = (2 exp(-t0 s) - 1)/s, so heaviside(t - t0) -> exp(-t0 s)/s
  // dirac(a t + c) = dirac(t - t0)/a -> exp(-t0 s)/a
  if (f === symbol(SGN) || f === symbol(DIRAC)) {
    const t0 = negate(divide(c, a));
    if (cmp_values(a, Constants.zero) !== 1 || cmp_values(t0, Constants.zero) === -1) {
      return null;
    }
    const shift = exponential(negate(multiply(t0, s)));
    return f === symbol(SGN)
      ? divide(subtract(multiply(integer(2), shift), Constants.one), s)
      : divide(shift, a);
  }
  return null;
}

// g(0); for a derivative, at(d(y(t),t),t,0) since subst would
// substitute into the differentiation variable as well.
function initialValue(g: U, t: U): U {
  return Find(g, symbol(DERIVATIVE))
    ? makeList(usr_symbol('at'), g, t, Constants.zero)
    : Eval(subst(g, t, Constants.zero));
}

// ------------------------------------------------------------- invlaplace

function invlaplace(F: U, s: U, t: U): U {
  if (!Find(F, s)) {
    return multiply(F, call(DIRAC, t));
  }
  if (isadd(F)) {
    return F.tail().reduce((acc: U, G: U) => add(acc, invlaplace(G, s, t)), Constants.zero);
  }

  // exp(-t0 s + c) G(s) -> exp(c) heaviside(t - t0) g(t - t0), t0 >= 0;
  // an impulse in g is only delayed, dirac(t - t0) needs no heaviside
  const fs = factors(F);
  const e = fs.findIndex((g) => isexp(g) && linear(caddr(g), s));
  if (e >= 0) {
    const [a, c] = linear(caddr(fs[e]), s);
    const t0 = negate(a);
    const g = invlaplace(product(fs.filter((_, i) => i !== e)), s, t);
    if (Find(g, symbol(INVLAPLACE)) || cmp_values(t0, Constants.zero) === -1) {
      return makeList(symbol(INVLAPLACE), F, s, t);
    }
    const step = call('heaviside', subtract(t, t0));
    const shifted = Eval(subst(g, t, subtract(t, t0)));
    const terms = isadd(shifted) ? shifted.tail() : [shifted];
    return multiply(
      exponential(c),
      terms.reduce(
        (acc: U, g: U) => add(acc, Find(g, symbol(DIRAC)) ? g : multiply(step, g)),
        Constants.zero
      )
    );
  }

  const parts = apart(F, s);
  const terms = isadd(parts) ? parts.tail() : [parts];
  return terms.reduce((acc: U, G: U) => add(acc, invterm(G, s, t)), Constants.zero);
}

// One partial fraction: c/(b1 s + b0)^n or (alpha s + beta)/(b2 s^2 + b1 s + b0).
function invterm(G: U, s: U, t: U): U {
  if (!Find(G, s)) {
    return invlaplace(G, s, t);
  }
  const unevaluated = makeList(symbol(INVLAPLACE), G, s, t);
  // the s-dependent factor with a negative integer exponent is the
  // denominator base^n; power() is avoided, it would expand (s+1)^3
  const isden = (g: U) =>
    car(g) === symbol(POWER) && nativeInt(caddr(g)) < 0 && Find(g, s);
  const dens = factors(G).filter(isden);
  const N = product(factors(G).filter((g) => !isden(g)));
  if (dens.length !== 1) {
    return unevaluated;
  }
  const base = cadr(dens[0]);
  const n = -nativeInt(caddr(dens[0]));

  const zero = Constants.zero;
  const d1 = derivative(base, s);
  const d2 = derivative(d1, s);
  const lin = linear(N, s);
  if (lin === null || Find(d2, s)) {
    return unevaluated;
  }
  const [alpha, beta] = lin;

  if (isZeroAtomOrTensor(d2)) {
    // c/(s - a)^n -> c t^(n-1) exp(a t)/(n-1)!
    if (!isZeroAtomOrTensor(alpha)) {
      return unevaluated;
    }
    const a = negate(divide(Eval(subst(base, s, zero)), d1));
    const c = divide(beta, power(d1, integer(n)));
    return divide(
      multiply(multiply(c, power(t, integer(n - 1))), exponential(multiply(a, t))),
      factorial(integer(n - 1))
    );
  }
  // (alpha s + beta)/(b2 s^2 + b1 s + b0)^n, and
  // s^2 + b1/b2 s + b0/b2 = (s - h)^2 + w2, so with u = s - h this is
  // (A u + B)/(u^2 + w2)^n, shifted by exp(h t)
  const b2 = divide(d2, integer(2));
  const b1 = Eval(subst(d1, s, zero));
  const b0 = Eval(subst(base, s, zero));
  const h = negate(divide(b1, d2));
  const w2 = subtract(divide(b0, b2), multiply(h, h));
  const bn = power(b2, integer(n));
  const A = divide(alpha, bn);
  const B = divide(add(beta, multiply(alpha, h)), bn);
  const eht = exponential(multiply(h, t));
  const sign = cmp_values(w2, zero);

  if (sign === 0) {
    // (s - h)^2n: apart gives linear factors, so only n = 1 gets here
    return n === 1 ? multiply(eht, add(A, multiply(B, t))) : unevaluated;
  }
  const hyperbolic = sign === -1;
  const [p, q] = quadratic(n, hyperbolic ? negate(w2) : w2, hyperbolic, t);
  return multiply(eht, add(multiply(A, p), multiply(B, q)));
}

// Inverses of u/(u^2 + c)^n and 1/(u^2 + c)^n (u^2 - c when hyperbolic).
// n = 1 is the table; since d/dc (u^2 + c)^-n = -n (u^2 + c)^-(n+1),
// each further power is -1/n (+1/n when hyperbolic) times the c-derivative.
function quadratic(n: number, c: U, hyperbolic: boolean, t: U): [U, U] {
  const k = usr_symbol('$c'); // placeholder for c, the parser can't produce it
  const r = power(k, rational(1, 2));
  let p = call(hyperbolic ? COSH : COS, multiply(r, t));
  let q = divide(call(hyperbolic ? SINH : SIN, multiply(r, t)), r);
  for (let i = 1; i < n; i++) {
    const f = rational(hyperbolic ? 1 : -1, i);
    p = multiply(f, derivative(p, k));
    q = multiply(f, derivative(q, k));
  }
  return [Eval(subst(p, k, c)), Eval(subst(q, k, c))];
}
