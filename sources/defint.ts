import {
  ABS,
  caddr,
  cadr,
  car,
  cddr,
  cdr,
  Constants,
  COS,
  DEFINT,
  INF,
  INTEGRAL,
  iscons,
  isdouble,
  ismultiply,
  istensor,
  LOG,
  NROOTS,
  PI,
  POWER,
  SIN,
  TAN,
  U,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { stop } from '../runtime/run';
import { symbol, usr_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { isNonzero, isPositive } from './assume';
import { derivative } from './derivative';
import { Eval } from './eval';
import { evalExactly, zzfloat } from './float';
import { imag } from './imag';
import { integral } from './integral';
import { ispolyfactoredorexpandedform } from './is';
import { limit } from './limit';
import { double, rational } from './bignum';
import { makeList } from './list';
import { hasPiecewise, piecewiseDefint } from './piecewise';
import { equal, length } from './misc';
import { divide, multiply, multiply_all, negate } from './multiply';
import { real } from './real';
import { simplify } from './simplify';
import { subst } from './subst';

/* defint =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
f,x,a,b[,y,c,d...]

General description
-------------------
Returns the definite integral of f with respect to x evaluated from "a" to b.
The argument list can be extended for multiple integrals (or "iterated
integrals"), for example a double integral (which can represent for
example a volume under a surface), or a triple integral, etc. For
example, defint(f,x,a,b,y,c,d).

*/
export function Eval_defint(p1: U) {
  return evalExactly(evalDefint, p1);
}

function evalDefint(p1: U) {
  const n = length(p1) - 1;
  if (n < 4 || (n - 1) % 3 !== 0) {
    stop(`defint: expected f,x,a,b[,y,c,d...], got ${n} arguments`);
  }
  let F = Eval(cadr(p1));

  p1 = cddr(p1);

  // defint can handle multiple
  // integrals, so we loop over the
  // multiple integrals here
  while (iscons(p1)) {
    const X = Eval(car(p1));
    p1 = cdr(p1);

    const A = Eval(car(p1));
    p1 = cdr(p1);

    const B = Eval(car(p1));
    p1 = cdr(p1);

    F = definite(F, X, A, B);
  }

  return F;
}

// the integral of F from A to B with respect to X
function definite(F: U, X: U, A: U, B: U): U {
  // constant factors stay outside: integral() gives a/(2+cos(x)) as a
  // complex log, whose branch cut neither limit() nor the jumps below see
  const factors = ismultiply(F) ? F.tail() : [];
  const constants = factors.filter((q) => !Find(q, X));
  if (constants.length > 0) {
    const rest = multiply_all(factors.filter((q) => Find(q, X)));
    // in float mode the rest has its factor 1.0 back: no progress
    if (!ismultiply(rest) || rest.tail().every((q) => Find(q, X))) {
      const inner = definite(rest, X, A, B);
      return car(inner) === symbol(DEFINT)
        ? makeList(symbol(DEFINT), F, X, A, B)
        : multiply(multiply_all(constants), inner);
    }
  }
  // piecewise: split at the break points when the bounds are numbers,
  // otherwise through the continuous antiderivative; unevaluated when
  // neither is possible
  const unevaluated = makeList(symbol(DEFINT), F, X, A, B);
  let antiderivative: U | undefined;
  if (hasPiecewise(F)) {
    const [a, b] = [toNumber(A), toNumber(B)];
    if (!isNaN(a) && !isNaN(b)) {
      const pieces = (G: U, from: U, to: U) => definite(G, X, from, to);
      return piecewiseDefint(F, X, [A, a], [B, b], pieces) || unevaluated;
    }
    antiderivative = integral(F, X);
    if (Find(antiderivative, symbol(INTEGRAL))) {
      return unevaluated;
    }
  }

  // an integrand with a pole inside the interval is an improper
  // integral; the antiderivative evaluated at the bounds would be wrong
  // (-2 for 1/x^2 from -1 to 1, which diverges)
  checkNoInteriorPole(F, X, A, B);

  // obtain the primitive of F against the
  // specified variable X
  // note that the primitive changes over
  // the calculation of the multiple
  // integrals.
  const integrand = F;
  F = antiderivative || integral(F, X); // contains the antiderivative of F

  // the primitive at the bounds, approached from inside the interval:
  // limit() substitutes where it can, and resolves +-inf and endpoint
  // singularities (log(0), 1/0) with a one-sided limit
  const dir = Math.sign(toNumber(B) - toNumber(A)) || 0;
  const sides = (side: number) => (dir ? [side * dir] : [-1, 1]);
  const arg1 = limit(F, X, B, sides(-1));
  const arg2 = limit(F, X, A, sides(1));

  // integral between B and A is the
  // subtraction. Note that this could
  // be a number but also a function.
  // and we might have to integrate this
  // number/function again doing the while
  // loop again if this is a multiple
  // integral.
  // F(B)-F(A) needs a continuous F: the jumps of F inside are added
  const jumps = crossesBranchCut(F, X, A, B) ? undefined : interiorJumps(integrand, F, X, A, B);
  if (jumps === undefined) {
    return unevaluated;
  }
  return add(subtract(arg1, arg2), dir < 0 ? negate(jumps) : jumps);
}

// The antiderivatives of rational functions of sin, cos and tan are written
// with tan(x/2) or tan(x) and jump where that tan is singular, although the
// integrand is finite there: arctan(tan(x/2)/sqrt(3)) for 1/(2+cos(x)) at
// pi. Returns the sum of F(r-)-F(r+) over the singular points r of F
// strictly between the numeric bounds, as one-sided limits; stops when the
// integrand has a pole at r (F = tan(x/2) for 1/(1+cos(x))), and returns
// undefined when a jump cannot be given exactly.
function interiorJumps(f: U, F: U, X: U, a: U, b: U): U | undefined {
  const [lo, hi] = [toNumber(a), toNumber(b)].sort((u, v) => u - v);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    return Constants.zero; // also NaN: symbolic bounds stay as they were
  }
  const { inside, points } = collector(lo, hi);
  poleIn(F, X, inside);
  points.sort((u, v) => u.r - v.r);
  // every jump costs two limits, unless they are all the same one; beyond
  // the cap unevaluated
  const same = equalJumps(F, X, points);
  if (inside.tooMany || (!same && points.length > MAX_JUMPS)) {
    return undefined;
  }
  let first: U | undefined;
  let total: U = Constants.zero;
  for (const { r, exact } of points) {
    // with other symbols in f there are no numbers to look at; the limits
    // of an F without logs below still see a pole
    const removable = isRemovable(f, X, r);
    if (removable === false) {
      stop(poleMessage(X, r));
    }
    // 1/(b+cos(x)): the logs of F stand for an arctan with a jump when
    // abs(b) > 1 and have poles otherwise, the limits cannot know
    if (removable === undefined && hasLogOf(F, X)) {
      return undefined;
    }
    if (exact === undefined) {
      // ponytail: a singular point known only as a float (a root from
      // nroots): ignored when F is continuous there, else no result
      if (jumpsAt(F, X, r)) {
        return undefined;
      }
      continue;
    }
    let jump = same ? first : undefined;
    if (jump === undefined) {
      try {
        const at = exact();
        jump = subtract(limit(F, X, at, [-1]), limit(F, X, at, [1]));
      } catch (e) {
        return undefined;
      }
      if (Find(jump, symbol(INF))) {
        stop(poleMessage(X, r)); // F is infinite there, so is its derivative
      }
      first = jump;
    }
    total = add(total, jump);
  }
  return total;
}

const MAX_JUMPS = 100; // limits taken one by one
const MAX_POINTS = 2000; // singular points of one sin, cos or tan looked at

// True when F(r-)-F(r+) is provably the same at all points: they are P
// apart, and F is c*x plus a function of tan(u) alone, each u linear in x
// with the period P or a fraction of it. Then F(x+P) = F(x)+c*P beside
// every point. (tan(u) becomes a symbol; what is left must have a constant
// derivative.)
function equalJumps(F: U, X: U, points: Point[]): boolean {
  if (points.length < 3 || points.some((q) => q.exact === undefined)) {
    return false;
  }
  const P = points[1].r - points[0].r;
  if (points.some((q, i) => i > 0 && Math.abs(q.r - points[i - 1].r - P) > 1e-9 * Math.abs(P))) {
    return false;
  }
  let periodic = true;
  let count = 0;
  const tans: U[] = [];
  const withoutTan = (p: U): U => {
    if (!iscons(p)) {
      return p;
    }
    if (car(p) === symbol(TAN)) {
      const periods = numericAt(derivative(cadr(p), X), X, 0) * P / Math.PI;
      periodic = periodic && Math.abs(periods - Math.round(periods)) < 1e-9 && Math.round(periods) !== 0;
      tans.push(usr_symbol(`defint_tan${count++}`));
      return tans[tans.length - 1];
    }
    return makeList(...[...p].map(withoutTan));
  };
  const slope = derivative(Eval(withoutTan(F)), X);
  return periodic && !Find(slope, X) && !tans.some((t) => Find(slope, t));
}

function hasLogOf(p: U, X: U): boolean {
  return iscons(p) && ((car(p) === symbol(LOG) && Find(p, X)) || p.tail().some((q) => hasLogOf(q, X)));
}

// A log of a complex argument in F jumps by 2*pi*i where the argument
// crosses the negative real axis; integral() writes such logs when a
// symbolic term keeps it from the real arctan form. True when that happens
// between the numeric bounds or at one of them (samples).
function crossesBranchCut(F: U, X: U, a: U, b: U): boolean {
  const [lo, hi] = [toNumber(a), toNumber(b)];
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || !iscons(F)) {
    return false;
  }
  if (car(F) !== symbol(LOG) || !Find(F, X) || !Find(F, Constants.imaginaryunit)) {
    return F.tail().some((q) => crossesBranchCut(q, X, a, b));
  }
  const SAMPLES = 100;
  let [prevRe, prevIm] = [NaN, NaN];
  for (let i = 0; i <= SAMPLES; i++) {
    let re = NaN;
    let im = NaN;
    try {
      const v = zzfloat(Eval(subst(cadr(F), X, double(lo + ((hi - lo) * i) / SAMPLES))));
      const [x, y] = [zzfloat(real(v)), zzfloat(imag(v))];
      [re, im] = [isdouble(x) ? x.d : NaN, isdouble(y) ? y.d : NaN];
    } catch (e) {
      // no value here
    }
    const onCut = re < 0 && Math.abs(im) < 1e-9 * Math.abs(re);
    if (onCut || (prevIm * im < 0 && (re < 0 || prevRe < 0))) {
      return true;
    }
    [prevRe, prevIm] = [re, im];
  }
  return false;
}

function poleMessage(X: U, r: number): string {
  return `defint: the integrand has a pole at ${X} = ${Number(r.toPrecision(6))} inside the interval`;
}

// the value of p at X = x as a JS number, NaN when it has none
function numericAt(p: U, X: U, x: number): number {
  try {
    const v = zzfloat(Eval(subst(p, X, double(x))));
    return isdouble(v) ? v.d : NaN;
  } catch (e) {
    return NaN;
  }
}

function jumpsAt(F: U, X: U, r: number): boolean {
  const eps = 1e-7 * Math.max(1, Math.abs(r));
  const gap = numericAt(F, X, r + eps) - numericAt(F, X, r - eps);
  return !(Math.abs(gap) < 1e-4);
}

type Point = { r: number; exact?: () => U };

// An Inside that takes every zero strictly inside (lo,hi) down in points
// (in no order) and lets poleIn search on.
function collector(lo: number, hi: number): { inside: Inside; points: Point[] } {
  const points: Point[] = [];
  const inside: Inside = (r, exact) => {
    // a zero known exactly is inside unless it is the bound itself (a jump
    // 10^(-5) inside counts); a numeric root may be the bound with an error
    const tol = (exact ? 1e-9 : 1e-4) * Math.max(1, Math.abs(r));
    if (r > lo + tol && r < hi - tol && !points.some((q) => Math.abs(q.r - r) < tol)) {
      points.push({ r, exact });
    }
  };
  if (Number.isFinite(lo) && Number.isFinite(hi)) {
    inside.range = [lo, hi];
  }
  return { inside, points };
}

// a bound as a JS number: +-Infinity for +-inf, NaN when not numeric
function toNumber(p: U): number {
  if (p === symbol(INF)) {
    return Infinity;
  }
  if (equal(p, negate(symbol(INF)))) {
    return -Infinity;
  }
  const d = zzfloat(p);
  return isdouble(d) ? d.d : NaN;
}

// Stops if f has a pole strictly between the numeric bounds a and b: a
// negative power (<= -1) of something with a real zero there (see zerosIn),
// or tan of a linear argument. A candidate is confirmed on the simplified
// integrand, (x^2-1)/(x-1) has no pole, and by the growth of f beside it.
// ponytail: numeric roots closer than ~1e-4 to a bound are taken as endpoint poles
function checkNoInteriorPole(f: U, X: U, a: U, b: U) {
  const [[lo, loU], [hi, hiU]] = [[toNumber(a), a] as const, [toNumber(b), b] as const].sort(
    (u, v) => u[0] - v[0]
  );
  if (isNaN(lo) || isNaN(hi)) {
    return;
  }
  // a symbolic pole, e.g. x = a with a > 0 in (0,inf): only when the
  // assumptions say it is strictly inside
  const symbolic = (r: U) =>
    (lo === -Infinity || isPositive(subtract(r, loU)) === true) &&
    (hi === Infinity || isPositive(subtract(hiU, r)) === true);
  // numeric candidates: all of them, the first one may be removable while
  // a later one is a pole (1/(1+tan(x)): pi/2 is harmless, 3*pi/4 is not)
  const found = collector(lo, hi);
  found.inside.symbolic = symbolic;
  const symbolicPole = poleIn(f, X, found.inside);
  if (symbolicPole === undefined && found.points.length === 0) {
    return;
  }
  const confirmed = collector(lo, hi);
  confirmed.inside.symbolic = symbolic;
  if (poleIn(simplify(f), X, confirmed.inside) !== undefined && symbolicPole !== undefined) {
    stop(`defint: the integrand has a pole at ${X} = ${symbolicPole} inside the interval`);
  }
  found.points.sort((u, v) => u.r - v.r);
  const pole = found.points.find(
    (c) =>
      confirmed.points.some((q) => Math.abs(q.r - c.r) < 1e-6 * Math.max(1, Math.abs(c.r))) &&
      !isRemovable(f, X, c.r) // undefined: a/(x-1), a pole unless a = 0
  );
  if (pole !== undefined) {
    stop(poleMessage(X, pole.r));
  }
}

// sin(x)/x at 0: the denominator vanishes but f stays bounded. Near a pole
// abs(f) grows about tenfold when the distance shrinks tenfold, at a
// removable singularity it does not.
// undefined when f has no numeric values there (other symbols).
function isRemovable(f: U, X: U, r: number): boolean | undefined {
  const absf = makeList(symbol(ABS), f); // f may be complex beside r
  const eps = 1e-4 * Math.max(1, Math.abs(r));
  const values = [-1, 1].map((side) => [eps, eps / 100].map((d) => numericAt(absf, X, r + side * d)));
  if (values.every((v) => v.every(Number.isNaN))) {
    return undefined;
  }
  return values.every(
    ([far, near]) => Number.isFinite(far) && Number.isFinite(near) && near < 2 * far + 1e-9
  );
}

// is told every numeric zero r; exact() is r as an expression when it is
// known exactly. symbolic: whether a symbolic zero is inside the interval. range: the finite interval to scan
// for the zeros of a denominator that is no polynomial.
type Inside = ((r: number, exact?: () => U) => void) & {
  symbolic?: (r: U) => boolean;
  range?: [number, number];
  tooMany?: boolean;
};

function poleIn(p: U, X: U, inside: Inside): string | undefined {
  if (!iscons(p) || !Find(p, X)) {
    return undefined;
  }
  const head = car(p);
  if (head === symbol(POWER)) {
    const k = zzfloat(caddr(p));
    if (isdouble(k) && k.d <= -1) {
      const r = zerosIn(cadr(p), X, inside);
      if (r !== undefined) {
        return r;
      }
    }
  }
  if (head === symbol(TAN)) {
    const r = zerosIn(makeList(symbol(COS), cadr(p)), X, inside);
    if (r !== undefined) {
      return r;
    }
  }
  for (const q of p.tail()) {
    const r = poleIn(q, X, inside);
    if (r !== undefined) {
      return r;
    }
  }
  return undefined;
}

// Reports the real zeros of g to inside: of sin(linear) or cos(linear)
// exactly, of a polynomial through nroots, of anything else (1+2*cos(x),
// exp(x)-2) by a scan of the finite interval. Returns a symbolic zero
// inside as text.
function zerosIn(g: U, X: U, inside: Inside): string | undefined {
  const head = car(g);
  if (head === symbol(SIN) || head === symbol(COS)) {
    // u = alpha*x + beta = k*pi (sin) or pi/2 + k*pi (cos)
    const u = cadr(g);
    const alphaU = derivative(u, X);
    const betaU = subst(u, X, Constants.zero);
    const alpha = zzfloat(alphaU);
    const beta = zzfloat(betaU);
    if (isdouble(alpha) && isdouble(beta) && alpha.d !== 0) {
      const isCos = head === symbol(COS);
      const offset = isCos ? Math.PI / 2 : 0;
      // ponytail: without a finite interval the zeros for |k| <= 1000
      const ends = (inside.range || []).map((x) => (alpha.d * x + beta.d - offset) / Math.PI);
      const from = ends.length ? Math.floor(Math.min(...ends)) : -1000;
      let to = ends.length ? Math.ceil(Math.max(...ends)) : 1000;
      if (to - from > MAX_POINTS) {
        // poles are still found among the first ones; jumps are not added up
        inside.tooMany = true;
        to = from + MAX_POINTS;
      }
      for (let k = from; k <= to; k++) {
        const kPi = multiply(rational(isCos ? 2 * k + 1 : k, isCos ? 2 : 1), symbol(PI));
        inside((offset + k * Math.PI - beta.d) / alpha.d, () =>
          divide(subtract(kPi, betaU), alphaU)
        );
      }
      return undefined;
    }
  }
  if (!ispolyfactoredorexpandedform(g, X)) {
    scanZeros(g, X, inside);
    return undefined;
  }
  let roots: U;
  try {
    roots = Eval(makeList(symbol(NROOTS), g, X));
  } catch (e) {
    return symbolicLinearZeroIn(g, X, inside); // symbolic coefficients
  }
  for (const z of istensor(roots) ? roots.elem : [roots]) {
    const re = zzfloat(real(z));
    const im = zzfloat(imag(z));
    if (isdouble(re) && isdouble(im) && Math.abs(im.d) < 1e-4 * Math.max(1, Math.abs(re.d))) {
      inside(re.d);
    }
  }
  return undefined;
}

// The zeros of g in the finite interval of inside, numerically: a change
// of sign between two samples is bisected, a local minimum of abs(g)
// without one (1-sin(x) at pi/2) is narrowed down; both count when g
// vanishes there, a change of sign through a pole of g does not.
// ponytail: fixed number of samples, two zeros between neighbouring samples
// are missed; sample adaptively if that ever matters
function scanZeros(g: U, X: U, inside: Inside) {
  if (!inside.range) {
    return;
  }
  const [lo, hi] = inside.range;
  const at = (x: number) => numericAt(g, X, x);
  if (Number.isNaN(at((lo + hi) / 2)) && Number.isNaN(at(lo + (hi - lo) / Math.E))) {
    return; // symbolic coefficients
  }
  const SAMPLES = 400;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    xs.push(lo + ((hi - lo) * i) / SAMPLES);
    ys.push(at(xs[i]));
  }
  const narrow = (a: number, b: number, leftIsNext: (p: number, q: number) => boolean) => {
    for (let i = 0; i < 60; i++) {
      const [p, q] = [a + (b - a) / 3, b - (b - a) / 3];
      if (leftIsNext(p, q)) {
        b = q;
      } else {
        a = p;
      }
    }
    return (a + b) / 2;
  };
  for (let i = 1; i <= SAMPLES; i++) {
    let r: number | undefined;
    if (ys[i] === 0) {
      r = xs[i];
    } else if (ys[i - 1] * ys[i] < 0) {
      const sign = Math.sign(ys[i - 1]);
      r = narrow(xs[i - 1], xs[i], (p) => Math.sign(at(p)) !== sign);
    } else if (
      i < SAMPLES &&
      Math.abs(ys[i]) < Math.abs(ys[i - 1]) &&
      Math.abs(ys[i]) <= Math.abs(ys[i + 1]) &&
      ys[i - 1] * ys[i + 1] > 0
    ) {
      r = narrow(xs[i - 1], xs[i + 1], (p, q) => Math.abs(at(p)) < Math.abs(at(q)));
    }
    if (r !== undefined && Math.abs(at(r)) < 1e-9) {
      inside(r);
    }
  }
}

// the zero of alpha*x + beta with symbolic alpha != 0 and beta, as text
function symbolicLinearZeroIn(g: U, X: U, inside: Inside): string | undefined {
  const alpha = derivative(g, X);
  if (Find(alpha, X) || isNonzero(alpha) !== true) {
    return undefined;
  }
  const r = negate(divide(subst(g, X, Constants.zero), alpha));
  return inside.symbolic?.(r) ? `${r}` : undefined;
}
