import bigInt from 'big-integer';
import {
  caddr,
  cadr,
  Constants,
  isadd,
  ismultiply,
  ispower,
  isrational,
  Num,
  U,
} from '../runtime/defs';
import { check_esc_flag, stop } from '../runtime/run';
import { add } from './add';
import { integer } from './bignum';
import { isinteger } from './is';
import { yyexpand } from './misc';
import { multiply } from './multiply';
import { power } from './power';
import { qadd } from './qadd';
import { qdiv } from './qdiv';
import { qmul } from './qmul';

/* Sparse multivariate polynomials over Q =====================================

A polynomial in the variables vars is a list of terms {e, c}: e holds the
exponent of each variable, c is a nonzero rational. The list is sorted by a
monomial order, largest first, so p[0] is the leading term.

  3*x^2*y + 2*x*y^3 - 1   in [x,y], lex   ->   [2,1]:3, [1,3]:2, [0,0]:-1

*/
export type Monomial = number[];
export type Term = { e: Monomial; c: Num };
export type MPoly = Term[];
// > 0 when a comes before b
export type Order = (a: Monomial, b: Monomial) => number;

const deg = (a: Monomial) => a.reduce((s, x) => s + x, 0);

function lex(a: Monomial, b: Monomial): number {
  const i = a.findIndex((x, k) => x !== b[k]);
  return i < 0 ? 0 : a[i] - b[i];
}

export const ORDERS: { [name: string]: Order } = {
  lex,
  grlex: (a, b) => deg(a) - deg(b) || lex(a, b),
  // same degree: the smaller exponent in the last differing variable wins
  grevlex: (a, b) => {
    const d = deg(a) - deg(b);
    if (d) return d;
    for (let i = a.length - 1; i >= 0; i--) {
      if (a[i] !== b[i]) return b[i] - a[i];
    }
    return 0;
  },
};

// Sorts, merges equal monomials and drops zero coefficients.
export function mpNormalize(p: MPoly, ord: Order): MPoly {
  const out: MPoly = [];
  for (const t of [...p].sort((s, t) => ord(t.e, s.e))) {
    const last = out[out.length - 1];
    if (last && ord(last.e, t.e) === 0) {
      out[out.length - 1] = { e: last.e, c: qadd(last.c, t.c) as Num };
    } else {
      out.push(t);
    }
  }
  return out.filter((t) => !t.c.a.isZero());
}

export function toMPoly(p: U, vars: U[], ord: Order): MPoly {
  const expanded = yyexpand(p);
  const terms: MPoly = [];
  for (const t of isadd(expanded) ? expanded.tail() : [expanded]) {
    let c = Constants.one;
    const e = vars.map(() => 0);
    for (const f of ismultiply(t) ? t.tail() : [t]) {
      if (isrational(f)) {
        c = qmul(c, f);
        continue;
      }
      const [base, n] = ispower(f) ? [cadr(f), caddr(f)] : [f, Constants.one];
      const i = vars.indexOf(base);
      if (i < 0 || !isinteger(n) || n.a.isNegative()) {
        stop(
          `groebner: ${p} is not a polynomial with rational coefficients in ${vars.join(
            ','
          )}`
        );
      }
      e[i] += n.a.toJSNumber();
    }
    terms.push({ e, c });
  }
  return mpNormalize(terms, ord);
}

export function fromMPoly(p: MPoly, vars: U[]): U {
  return p.reduce(
    (sum: U, t) =>
      add(
        sum,
        t.e.reduce(
          (m: U, x, i) => multiply(m, power(vars[i], integer(x))),
          t.c
        )
      ),
    Constants.zero
  );
}

export const mpSub = (p: MPoly, q: MPoly, ord: Order) =>
  mpNormalize(
    p.concat(q.map((t) => ({ e: t.e, c: qmul(t.c, Constants.negOne) }))),
    ord
  );

// c*x^e*p; a monomial order is kept by multiplication
export const mpMulTerm = (p: MPoly, c: Num, e: Monomial): MPoly =>
  p.map((t) => ({ e: t.e.map((x, i) => x + e[i]), c: qmul(t.c, c) }));

export const divides = (a: Monomial, b: Monomial) =>
  a.every((x, i) => x <= b[i]);

export const monic = (p: MPoly) =>
  mpMulTerm(p, qdiv(Constants.one, p[0].c), p[0].e.map(() => 0));

// Remainder of the division of f by the polynomials in G: no term of the
// result is divisible by a leading monomial of G.
export function mpReduce(f: MPoly, G: MPoly[], ord: Order): MPoly {
  const r: MPoly = [];
  let p = f;
  while (p.length) {
    check_esc_flag(); // nothing here goes through Eval
    const t = p[0];
    const g = G.find((g) => divides(g[0].e, t.e));
    if (g) {
      const q = qdiv(t.c, g[0].c);
      p = mpSub(p, mpMulTerm(g, q, t.e.map((x, i) => x - g[0].e[i])), ord);
    } else {
      r.push(t);
      p = p.slice(1);
    }
  }
  return r;
}

// Integer coefficients without common factor, sign of the leading one kept.
export function mpPrimitive(p: MPoly): MPoly {
  const den = p.reduce((l, t) => bigInt.lcm(l, t.c.b), bigInt.one);
  const num = p.reduce((g, t) => bigInt.gcd(g, t.c.a), bigInt.zero);
  return mpMulTerm(p, qdiv(new Num(den), new Num(num)), p[0].e.map(() => 0));
}
