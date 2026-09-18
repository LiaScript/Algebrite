import {
  caddr,
  cadr,
  Constants,
  isadd,
  ismultiply,
  ispower,
  isrational,
  SECRETX,
  U
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { integer, nativeInt } from './bignum';
import { coeff } from './coeff';
import { denominator } from './denominator';
import { Eval } from './eval';
import { ispolyexpandedform, isZeroAtomOrTensor } from './is';
import { yyexpand } from './misc';
import { divide, multiply, multiply_all } from './multiply';
import { numerator } from './numerator';
import { power } from './power';
import { divpoly } from './quotient';
import { rationalize } from './rationalize';
import { resultant } from './resultant';
import { simplify } from './simplify';
import { subst } from './subst';

// Gosper's algorithm (Petkovsek, Wilf, Zeilberger: A = B, chapter 5).
// For a hypergeometric term t, i.e. t(x+1)/t(x) rational in x, it decides
// whether t has a hypergeometric antidifference z with z(x+1) - z(x) = t and
// returns it, so that sum_{x=a}^{b} t = z(b+1) - z(a); null when there is none
// (1/x, 1/x!, x!) or t is not hypergeometric.
//
// 1. t(x+1)/t(x) = a(x)/b(x) * c(x+1)/c(x) with gcd(a(x), b(x+h)) = 1 for all
//    integers h >= 0. The h with a common factor are the integer roots of
//    the resultant of a(x) and b(x+h); each common factor g moves into c.
// 2. a(x)*X(x+1) - b(x-1)*X(x) = c(x) is solved for a polynomial X of bounded
//    degree, a linear system in its coefficients.
// 3. z = b(x-1)*X(x)/c(x) * t(x)
//
// ponytail: the resultant is a Sylvester determinant expanded over all
// permutations, hence MAX_SYLVESTER; its roots are searched up to
// MAX_DISPERSION only. Subresultants and the rational root theorem would
// lift both limits.
const MAX_SYLVESTER = 6;
const MAX_DISPERSION = 100;
const MAX_DEGREE = 20;

const isZero = (p: U) => isZeroAtomOrTensor(simplify(p));

export function gosper(t: U, x: U): U | null {
  // coefficients in x, lowest first, no leading zeros ([] for 0)
  const coeffs = (p: U): U[] => {
    const c = coeff(yyexpand(p), x).map(simplify);
    while (c.length > 0 && isZeroAtomOrTensor(c[c.length - 1])) {
      c.pop();
    }
    return c;
  };
  const build = (c: U[]): U =>
    c.reduce(
      (acc: U, ci, i) => add(acc, multiply(ci, power(x, integer(i)))),
      Constants.zero
    );
  const shift = (p: U, h: U) => yyexpand(subst(p, x, add(x, h)));
  const gcd = (p: U, q: U): U => {
    while (coeffs(q).length > 0) {
      [p, q] = [q, build(coeffs(subtract(p, multiply(q, divpoly(p, q, x)))))];
    }
    // monic: a leading coefficient in the parameters would spread into
    // both quotients by g
    const cp = coeffs(p);
    return build(cp.map((ci) => simplify(divide(ci, cp[cp.length - 1]))));
  };

  // Polynomial factors of a product go into c right away, which keeps the
  // resultant small: x^5*2^x has the ratio 2 instead of 2*(x+1)^5/x^5.
  const isPoly = (p: U) => Find(p, x) && ispolyexpandedform(p, x);
  const c0 = ismultiply(t) ? multiply_all(t.tail().filter(isPoly)) : Constants.one;
  const hyper = divide(t, c0);

  // the ratio of a sum of similar terms: everything is divided by the first
  // term, (x+1)! - x! is not simplified as a whole
  const terms = isadd(hyper) ? hyper.tail() : [hyper];
  const over = terms.map((p) => simplify(divide(p, terms[0])));
  const whole = over.reduce(add, Constants.zero);
  // u(x+1)/u(x) factor by factor: simplify does not get through
  // (2*x+2)!*x!^2/((2*x)!*(x+1)!^2) as a whole
  const step = (u: U): U =>
    ismultiply(u)
      ? multiply_all(u.tail().map(step))
      : ispower(u) && !Find(caddr(u), x)
      ? power(step(cadr(u)), caddr(u))
      : simplify(divide(shift(u, Constants.one), u));
  const ratio = rationalize(
    divide(
      terms.map((u, i) => multiply(step(u), over[i])).reduce(add, Constants.zero),
      whole
    )
  );
  const parts = [numerator(ratio), denominator(ratio)].map(yyexpand);
  if (parts.some((p) => Find(p, x) && !ispolyexpandedform(p, x))) {
    return null;
  }
  let [a, b] = parts.map((p) => build(coeffs(p)));

  let c = c0;
  if (Find(a, x) && Find(b, x)) {
    if (coeffs(a).length + coeffs(b).length - 2 > MAX_SYLVESTER) {
      return null;
    }
    const h = symbol(SECRETX);
    const R = resultant(a, shift(b, h), x);
    for (let j = 0; j <= MAX_DISPERSION; j++) {
      if (!isZero(Eval(subst(R, h, integer(j))))) {
        continue;
      }
      const g = gcd(a, shift(b, integer(j)));
      if (!Find(g, x)) {
        continue;
      }
      a = build(coeffs(divpoly(a, g, x)));
      b = build(coeffs(divpoly(b, shift(g, integer(-j)), x)));
      for (let i = 1; i <= j; i++) {
        c = multiply(c, shift(g, integer(-i)));
      }
    }
  }

  const B = shift(b, Constants.negOne);
  const [ca, cB, cc] = [a, B, c].map(coeffs);
  const d = ca.length - 1;
  let D = cc.length - 1 - Math.max(d, cB.length - 1);
  if (d === cB.length - 1 && isZero(subtract(ca[d], cB[d]))) {
    D = cc.length - d;
    if (d > 0) {
      const n0 = nativeInt(
        simplify(divide(subtract(cB[d - 1], ca[d - 1]), ca[d]))
      );
      D = isNaN(n0) ? D : Math.max(D, n0);
    }
  }
  if (D < 0 || D > MAX_DEGREE) {
    return null;
  }

  // One column for the image of each x^j, the last one for c. Lowest powers
  // first: a free unknown is then a high power and X gets the lowest degree.
  const columns = Array.from({ length: D + 1 }, (_, j) =>
    coeffs(
      subtract(
        multiply(a, power(add(x, Constants.one), integer(j))),
        multiply(B, power(x, integer(j)))
      )
    )
  ).concat([cc]);
  const rows = Math.max(...columns.map((col) => col.length));
  const X = solveLinear(
    Array.from({ length: rows }, (_, i) =>
      columns.map((col) => col[i] ?? Constants.zero)
    ),
    D + 1
  );
  if (!X) {
    return null;
  }
  // simplify does not cancel a common factor such as x^2+x-1
  // ponytail: with parameters in the coefficients Euclid's algorithm swells
  // beyond use (x^3*y^x), the fraction is then left to simplify
  const w = rationalize(whole);
  const num = build(coeffs(multiply(multiply(B, build(X)), numerator(w))));
  const den = build(coeffs(multiply(c, denominator(w))));
  const numeric = [num, den].every((p) => coeffs(p).every(isrational));
  const g = numeric ? gcd(num, den) : Constants.one;
  return simplify(
    multiply(
      divide(divpoly(num, g, x), divpoly(den, g, x)),
      multiply(c0, terms[0])
    )
  );
}

// Gauss-Jordan elimination of the augmented matrix M with n unknowns, free
// unknowns are set to 0; null for an inconsistent system.
function solveLinear(M: U[][], n: number): U[] | null {
  const pivotRow: number[] = [];
  let row = 0;
  for (let col = 0; col < n; col++) {
    const p = M.findIndex((r, i) => i >= row && !isZero(r[col]));
    if (p < 0) {
      pivotRow.push(-1);
      continue;
    }
    [M[row], M[p]] = [M[p], M[row]];
    const pivot = M[row][col];
    M[row] = M[row].map((v) => simplify(divide(v, pivot)));
    M.forEach((r, i) => {
      if (i !== row && !isZero(r[col])) {
        const f = r[col];
        M[i] = r.map((v, j) => simplify(subtract(v, multiply(f, M[row][j]))));
      }
    });
    pivotRow.push(row++);
  }
  if (M.slice(row).some((r) => !isZero(r[n]))) {
    return null;
  }
  return pivotRow.map((p) => (p < 0 ? Constants.zero : M[p][n]));
}
