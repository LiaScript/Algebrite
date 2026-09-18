import {
  caddr,
  cadr,
  car,
  cddr,
  cdr,
  Constants,
  COS,
  INF,
  iscons,
  isdouble,
  istensor,
  NROOTS,
  POWER,
  SIN,
  TAN,
  U,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { stop } from '../runtime/run';
import { symbol } from '../runtime/symbol';
import { subtract } from './add';
import { isNonzero, isPositive } from './assume';
import { derivative } from './derivative';
import { Eval } from './eval';
import { zzfloat } from './float';
import { imag } from './imag';
import { integral } from './integral';
import { ispolyfactoredorexpandedform } from './is';
import { limit } from './limit';
import { makeList } from './list';
import { equal, length } from './misc';
import { divide, negate } from './multiply';
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

    // an integrand with a pole inside the interval is an improper
    // integral; the antiderivative evaluated at the bounds would be wrong
    // (-2 for 1/x^2 from -1 to 1, which diverges)
    checkNoInteriorPole(F, X, A, B);

    // obtain the primitive of F against the
    // specified variable X
    // note that the primitive changes over
    // the calculation of the multiple
    // integrals.
    F = integral(F, X); // contains the antiderivative of F

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
    F = subtract(arg1, arg2);
  }

  return F;
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
// negative power (<= -1) of a polynomial with a real root there (nroots),
// or of sin/cos of a linear argument, or tan of one. A candidate is
// confirmed on the simplified integrand, (x^2-1)/(x-1) has no pole.
// ponytail: poles closer than ~1e-4 to a bound are taken as endpoint poles
function checkNoInteriorPole(f: U, X: U, a: U, b: U) {
  const [[lo, loU], [hi, hiU]] = [[toNumber(a), a] as const, [toNumber(b), b] as const].sort(
    (u, v) => u[0] - v[0]
  );
  if (isNaN(lo) || isNaN(hi)) {
    return;
  }
  const inside: Inside = (r: number) => {
    const tol = 1e-4 * Math.max(1, Math.abs(r));
    return r > lo + tol && r < hi - tol;
  };
  // a symbolic pole, e.g. x = a with a > 0 in (0,inf): only when the
  // assumptions say it is strictly inside
  inside.symbolic = (r: U) =>
    (lo === -Infinity || isPositive(subtract(r, loU)) === true) &&
    (hi === Infinity || isPositive(subtract(hiU, r)) === true);
  const pole = poleIn(f, X, inside);
  if (pole !== undefined && poleIn(simplify(f), X, inside) !== undefined) {
    stop(`defint: the integrand has a pole at ${X} = ${pole} inside the interval`);
  }
}

type Inside = ((r: number) => boolean) & { symbolic?: (r: U) => boolean };

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

// a zero of the polynomial, sin(linear) or cos(linear) g inside, as text
function zerosIn(g: U, X: U, inside: Inside): string | undefined {
  const head = car(g);
  if (head === symbol(SIN) || head === symbol(COS)) {
    // u = alpha*x + beta = k*pi (sin) or pi/2 + k*pi (cos)
    const u = cadr(g);
    const alpha = zzfloat(derivative(u, X));
    const beta = zzfloat(subst(u, X, Constants.zero));
    if (!isdouble(alpha) || !isdouble(beta) || alpha.d === 0) {
      return undefined;
    }
    const offset = head === symbol(COS) ? Math.PI / 2 : 0;
    // ponytail: tries the zeros for |k| <= 1000, compute the k range if needed
    for (let k = -1000; k <= 1000; k++) {
      const r = (offset + k * Math.PI - beta.d) / alpha.d;
      if (inside(r)) {
        return `${Number(r.toPrecision(6))}`;
      }
    }
    return undefined;
  }
  if (!ispolyfactoredorexpandedform(g, X)) {
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
    if (
      isdouble(re) &&
      isdouble(im) &&
      Math.abs(im.d) < 1e-4 * Math.max(1, Math.abs(re.d)) &&
      inside(re.d)
    ) {
      return `${Number(re.d.toPrecision(6))}`;
    }
  }
  return undefined;
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
