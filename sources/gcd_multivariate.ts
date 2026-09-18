import bigInt from 'big-integer';
import {
  cadr,
  Constants,
  isadd,
  iscons,
  ismultiply,
  ispower,
  Num,
  U,
} from '../runtime/defs';
import { check_esc_flag } from '../runtime/run';
import { collectUserSymbols } from '../runtime/symbol';
import { gcd_numbers } from './bignum';
import {
  divides,
  fromMPoly,
  MPoly,
  mpMulTerm,
  mpNormalize,
  mpPrimitive,
  mpSub,
  ORDERS,
  toMPoly,
} from './mpoly';
import { multiply } from './multiply';
import { qdiv } from './qdiv';
import { qmul } from './qmul';

/* gcd of polynomials in several variables with rational coefficients =========

Comparing the factors found in one main variable misses every common factor
that the factorization does not split off, e.g. the 2*y^2+4*z of
(2*y^2+4*z)*(x+1) and (2*y^2+4*z)*(x^2*y-3). Here the polynomials are taken as
polynomials in the first variable whose coefficients are polynomials in the
other ones: gcd = gcd of the contents (recursively, one variable less) times
the gcd of the primitive parts, which the primitive remainder sequence gives
(Euclid with pseudo-division, every remainder divided by its content).

With lex order and the variables before k absent, the terms of a polynomial
are grouped by the exponent of variable k, largest first.

The remainders of coprime polynomials grow quickly, and coprime is what most
internal callers (rationalize, simplify) ask about. So both polynomials are
first evaluated at integers in all variables but one: when the leading
coefficients survive and the images are coprime, so are the primitive parts.
Whatever still gets too big gives up after WORK_LIMIT term products, and gcd()
falls back to comparing terms and factors.
*/
const ord = ORDERS.lex;
// ponytail: about a second, a term product costs some rational arithmetic.
// Dense polynomials in five variables with a common factor need more; integer
// instead of rational coefficients, then a modular gcd (Zippel's sparse
// interpolation) are the upgrade path.
const WORK_LIMIT = 5e4;
const POINTS = [
  [3, 7, 11, 13, 17, 19, 23],
  [-5, 2, 29, -3, 31, 37, 41],
];
let work = 0;

function spend(n: number) {
  work -= n;
  if (work < 0) {
    throw new Error('gcd: too big');
  }
}

const degree = (p: MPoly, k: number) => (p.length ? p[0].e[k] : -1);

function mpMul(p: MPoly, q: MPoly): MPoly {
  spend(p.length * q.length);
  return mpNormalize(
    q.reduce((acc: MPoly, t) => acc.concat(mpMulTerm(p, t.c, t.e)), []),
    ord
  );
}

// f/g, g divides f
function mpDivExact(f: MPoly, g: MPoly): MPoly {
  const q: MPoly = [];
  let p = f;
  while (p.length) {
    check_esc_flag();
    spend(g.length);
    const t = p[0];
    if (!divides(g[0].e, t.e)) {
      throw new Error('gcd: inexact division');
    }
    const c = qdiv(t.c, g[0].c) as Num;
    const e = t.e.map((x, i) => x - g[0].e[i]);
    q.push({ e, c });
    p = mpSub(p, mpMulTerm(g, c, e), ord);
  }
  return q;
}

// The coefficients of p as a polynomial in variable k, highest power first.
function coefficients(p: MPoly, k: number): MPoly[] {
  const out: MPoly[] = [];
  let d = -1;
  for (const t of p) {
    if (t.e[k] !== d) {
      d = t.e[k];
      out.push([]);
    }
    out[out.length - 1].push({ e: t.e.map((x, i) => (i === k ? 0 : x)), c: t.c });
  }
  return out;
}

const isConstant = (p: MPoly) => p.length === 1 && p[0].e.every((x) => x === 0);

function content(p: MPoly, k: number): MPoly {
  const cs = coefficients(p, k);
  let g = cs[0];
  for (const c of cs.slice(1)) {
    if (isConstant(g)) {
      break;
    }
    g = mpGcd(g, c, k + 1);
  }
  return g;
}

const primitivePart = (p: MPoly, k: number): MPoly =>
  mpPrimitive(mpDivExact(p, content(p, k)));

// Pseudo-remainder of a by b in variable k, up to a rational factor
function pseudoRemainder(a: MPoly, b: MPoly, k: number): MPoly {
  const lb = coefficients(b, k)[0];
  while (degree(a, k) >= degree(b, k)) {
    check_esc_flag();
    const shift = a[0].e.map((_, i) => (i === k ? degree(a, k) - degree(b, k) : 0));
    const la = coefficients(a, k)[0];
    a = mpSub(mpMul(a, lb), mpMulTerm(mpMul(b, la), Constants.one, shift), ord);
    // any rational multiple will do, and the numbers stay small
    a = a.length ? mpPrimitive(a) : a;
  }
  return a;
}

// p as a polynomial in variable k alone, the variables after it set to the
// integers of point; undefined when that lowers the degree
function image(p: MPoly, k: number, point: number[]): MPoly | undefined {
  const at = (t: MPoly[0]): MPoly[0] => ({
    e: t.e.map((x, i) => (i === k ? x : 0)),
    c: t.e.reduce(
      (c, x, i) => (i > k ? (qmul(c, new Num(bigInt(point[i % point.length]).pow(x))) as Num) : c),
      t.c
    ),
  });
  const q = mpNormalize(p.map(at), ord);
  return degree(q, k) === degree(p, k) ? q : undefined;
}

function coprimeImages(a: MPoly, b: MPoly, k: number): boolean {
  if (![...a, ...b].some((t) => t.e.some((x, i) => i > k && x > 0))) {
    return false; // one variable: the remainder sequence is the test
  }
  return POINTS.some((point) => {
    const [ia, ib] = [image(a, k, point), image(b, k, point)];
    return ia && ib && degree(mpGcd(ia, ib, k), k) === 0;
  });
}

// gcd of f and g, polynomials in the variables k, k+1, ...; up to a rational
// factor, which the caller fixes
function mpGcd(f: MPoly, g: MPoly, k: number): MPoly {
  if (!f.length || !g.length) {
    return f.length ? f : g;
  }
  if (k === f[0].e.length || isConstant(f) || isConstant(g)) {
    return [{ e: f[0].e.map(() => 0), c: Constants.one }];
  }
  const c = mpGcd(content(f, k), content(g, k), k + 1);
  let a = primitivePart(f, k);
  let b = primitivePart(g, k);
  if (degree(a, k) < degree(b, k)) {
    [a, b] = [b, a];
  }
  if (coprimeImages(a, b, k)) {
    return c;
  }
  while (b.length && degree(b, k) > 0) {
    const r = pseudoRemainder(a, b, k);
    a = b;
    b = r.length ? primitivePart(r, k) : r;
  }
  // a remainder free of variable k that is not zero: coprime primitive parts
  return b.length ? c : mpMul(c, a);
}

// Symbols in the order x, y, z, t, s, then by name, so that the result does
// not depend on the order of the arguments and gcd(a^2-x^2,x-a) is x-a.
function sortKey(v: U): string {
  const i = ['x', 'y', 'z', 't', 's'].indexOf(v.toString());
  return i < 0 ? '1' + v : '0' + i;
}

// The gcd of two polynomials with rational coefficients in two or more
// symbols, at least one of them a sum and the other one a sum or a monomial:
// primitive with a positive leading coefficient, times the gcd of the numeric
// contents. undefined for anything else (functions, symbolic or fractional
// exponents, floats, factored arguments, which keep their factors).
export function gcdMultivariate(p1: U, p2: U): U | undefined {
  // no sum inside a product or power: toMPoly would expand it
  const monomial = (p: U) =>
    (ismultiply(p) ? p.tail() : [p]).every(
      (f) => !iscons(f) || (ispower(f) && !iscons(cadr(f)))
    );
  if (
    (!isadd(p1) && !isadd(p2)) ||
    ![p1, p2].every((p) => isadd(p) || monomial(p))
  ) {
    return;
  }
  const vars: U[] = [];
  collectUserSymbols(p1, vars);
  collectUserSymbols(p2, vars);
  if (vars.length < 2) {
    return;
  }
  vars.sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : 1));
  let P: MPoly[];
  let G: MPoly;
  try {
    P = [p1, p2].map((p) => toMPoly(p, vars, ord));
    work = WORK_LIMIT;
    G = mpPrimitive(mpGcd(mpPrimitive(P[0]), mpPrimitive(P[1]), 0));
  } catch (error) {
    // not polynomials, or too big; a time limit that has passed stops again
    check_esc_flag();
    return;
  }
  if (G[0].c.a.isNegative()) {
    G = mpMulTerm(G, Constants.negOne, G[0].e.map(() => 0));
  }
  const numeric = P.map((p) => p.map((t) => t.c).reduce(gcd_numbers));
  return multiply(gcd_numbers(numeric[0], numeric[1]), fromMPoly(G, vars));
}
