import bigInt from 'big-integer';
import { Constants, Num, U } from '../runtime/defs';
import { check_esc_flag } from '../runtime/run';
import { collectUserSymbols } from '../runtime/symbol';
import { factorZ, zMul, ZPoly } from './factor_zassenhaus';
import {
  divides,
  fromMPoly,
  Monomial,
  MPoly,
  mpMulTerm,
  mpNormalize,
  mpPrimitive,
  mpSub,
  ORDERS,
  toMPoly,
} from './mpoly';
import { power } from './power';
import { integer } from './bignum';
import { qdiv } from './qdiv';

/* Factoring polynomials in several variables ==================================

Kronecker's substitution x1 -> t, x2 -> t^(d1+1), x3 -> t^((d1+1)*(d2+1)), ...
with di the degree in xi maps P to a polynomial in t. The map keeps products,
and it is one-to-one on everything whose degrees stay within d1, d2, ..., so
the image of a factor of P is a product of irreducible factors of the image
of P. Every such product is mapped back and tried by division.

ponytail: exponential in the number of factors of the image, fine for the
textbook polynomials this is meant for. Multivariate Hensel lifting (Wang's
algorithm) is the upgrade path.
*/
const MAX_IMAGE_DEGREE = 250;
const MAX_IMAGE_FACTORS = 14;

const ord = ORDERS.lex;

// f/g if g divides f, with integer coefficients
function mpDivExact(f: MPoly, g: MPoly): MPoly | undefined {
  const q: MPoly = [];
  let p = f;
  while (p.length) {
    check_esc_flag();
    const t = p[0];
    if (!divides(g[0].e, t.e)) {
      return;
    }
    const c = qdiv(t.c, g[0].c) as Num;
    if (!c.b.equals(1)) {
      return;
    }
    const e = t.e.map((x, i) => x - g[0].e[i]);
    q.push({ e, c });
    p = mpSub(p, mpMulTerm(g, c, e), ord);
  }
  return q;
}

function* subsets(n: number, k: number): Generator<number[]> {
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    yield idx.slice();
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) {
      i--;
    }
    if (i < 0) {
      return;
    }
    idx[i]++;
    for (let j = i + 1; j < k; j++) {
      idx[j] = idx[j - 1] + 1;
    }
  }
}

// Factors of p, a polynomial in X and other symbols with rational
// coefficients; undefined when p is something else, too big, or does not
// split.
export function factorKronecker(p: U, X: U): U[] | undefined {
  const vars: U[] = [];
  collectUserSymbols(p, vars);
  if (vars.length < 2 || vars.indexOf(X) < 0) {
    return;
  }
  vars.splice(vars.indexOf(X), 1);
  vars.unshift(X);

  let P: MPoly;
  try {
    P = toMPoly(p, vars, ord);
  } catch (error) {
    // sin(y), y^(1/2), 1/y: not a polynomial
    return;
  }
  if (P.length < 2) {
    return;
  }
  const primitive = mpPrimitive(P);
  let content = qdiv(P[0].c, primitive[0].c) as Num;
  P = primitive;

  // powers of single variables
  const out: U[] = [];
  const low = vars.map((_, i) => Math.min(...P.map((t) => t.e[i])));
  low.forEach((k, i) => k && out.push(power(vars[i], integer(k))));
  P = P.map((t) => ({ e: t.e.map((x, i) => x - low[i]), c: t.c }));

  const radix = vars.map((_, i) => 1 + Math.max(...P.map((t) => t.e[i])));
  const weight = radix.map((_, i) =>
    radix.slice(0, i).reduce((a, b) => a * b, 1)
  );
  if (radix.reduce((a, b) => a * b, 1) - 1 > MAX_IMAGE_DEGREE) {
    return;
  }
  const image: ZPoly = [];
  for (const t of P) {
    image[t.e.reduce((s, x, i) => s + x * weight[i], 0)] = t.c.a;
  }
  for (let i = 0; i < image.length; i++) {
    image[i] = image[i] || bigInt.zero;
  }
  const factored = factorZ(image);
  if (!factored) {
    return;
  }
  let rest: ZPoly[] = [];
  for (const [g, mult] of factored.factors) {
    for (let k = 0; k < mult; k++) {
      rest.push(g);
    }
  }
  if (rest.length > MAX_IMAGE_FACTORS) {
    return;
  }

  const back = (G: ZPoly): MPoly => {
    const terms: MPoly = [];
    G.forEach((c, E) => {
      if (!c.isZero()) {
        const e: Monomial = radix.map((r) => {
          const digit = E % r;
          E = Math.floor(E / r);
          return digit;
        });
        terms.push({ e, c: new Num(c) });
      }
    });
    const h = mpNormalize(terms, ord);
    return h[0].c.a.isNegative() ? mpMulTerm(h, Constants.negOne, h[0].e.map(() => 0)) : h;
  };

  const found: MPoly[] = [];
  let k = 1;
  search: while (k < rest.length) {
    for (const idx of subsets(rest.length, k)) {
      const h = back(idx.reduce((G: ZPoly, i) => zMul(G, rest[i]), [bigInt.one]));
      const q = h.length > 1 ? mpDivExact(P, h) : undefined;
      if (q) {
        found.push(h);
        P = q;
        rest = rest.filter((_, i) => idx.indexOf(i) < 0);
        continue search;
      }
    }
    k++;
  }
  if (!found.length && !out.length && content.a.equals(1) && content.b.equals(1)) {
    return;
  }
  if (P.length === 1 && P[0].e.every((x) => x === 0)) {
    // what is left is the sign
    content = qdiv(content, qdiv(Constants.one, P[0].c)) as Num;
  } else {
    found.push(P);
  }
  return [content, ...out, ...found.map((h) => fromMPoly(h, vars))];
}
