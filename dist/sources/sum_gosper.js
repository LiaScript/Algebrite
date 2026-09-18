"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gosper = void 0;
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const coeff_1 = require("./coeff");
const denominator_1 = require("./denominator");
const eval_1 = require("./eval");
const is_1 = require("./is");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const numerator_1 = require("./numerator");
const power_1 = require("./power");
const quotient_1 = require("./quotient");
const rationalize_1 = require("./rationalize");
const resultant_1 = require("./resultant");
const simplify_1 = require("./simplify");
const subst_1 = require("./subst");
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
const isZero = (p) => is_1.isZeroAtomOrTensor(simplify_1.simplify(p));
function gosper(t, x) {
    // coefficients in x, lowest first, no leading zeros ([] for 0)
    const coeffs = (p) => {
        const c = coeff_1.coeff(misc_1.yyexpand(p), x).map(simplify_1.simplify);
        while (c.length > 0 && is_1.isZeroAtomOrTensor(c[c.length - 1])) {
            c.pop();
        }
        return c;
    };
    const build = (c) => c.reduce((acc, ci, i) => add_1.add(acc, multiply_1.multiply(ci, power_1.power(x, bignum_1.integer(i)))), defs_1.Constants.zero);
    const shift = (p, h) => misc_1.yyexpand(subst_1.subst(p, x, add_1.add(x, h)));
    const gcd = (p, q) => {
        while (coeffs(q).length > 0) {
            [p, q] = [q, build(coeffs(add_1.subtract(p, multiply_1.multiply(q, quotient_1.divpoly(p, q, x)))))];
        }
        // monic: a leading coefficient in the parameters would spread into
        // both quotients by g
        const cp = coeffs(p);
        return build(cp.map((ci) => simplify_1.simplify(multiply_1.divide(ci, cp[cp.length - 1]))));
    };
    // Polynomial factors of a product go into c right away, which keeps the
    // resultant small: x^5*2^x has the ratio 2 instead of 2*(x+1)^5/x^5.
    const isPoly = (p) => find_1.Find(p, x) && is_1.ispolyexpandedform(p, x);
    const c0 = defs_1.ismultiply(t) ? multiply_1.multiply_all(t.tail().filter(isPoly)) : defs_1.Constants.one;
    const hyper = multiply_1.divide(t, c0);
    // the ratio of a sum of similar terms: everything is divided by the first
    // term, (x+1)! - x! is not simplified as a whole
    const terms = defs_1.isadd(hyper) ? hyper.tail() : [hyper];
    const over = terms.map((p) => simplify_1.simplify(multiply_1.divide(p, terms[0])));
    const whole = over.reduce(add_1.add, defs_1.Constants.zero);
    // u(x+1)/u(x) factor by factor: simplify does not get through
    // (2*x+2)!*x!^2/((2*x)!*(x+1)!^2) as a whole
    const step = (u) => defs_1.ismultiply(u)
        ? multiply_1.multiply_all(u.tail().map(step))
        : defs_1.ispower(u) && !find_1.Find(defs_1.caddr(u), x)
            ? power_1.power(step(defs_1.cadr(u)), defs_1.caddr(u))
            : simplify_1.simplify(multiply_1.divide(shift(u, defs_1.Constants.one), u));
    const ratio = rationalize_1.rationalize(multiply_1.divide(terms.map((u, i) => multiply_1.multiply(step(u), over[i])).reduce(add_1.add, defs_1.Constants.zero), whole));
    const parts = [numerator_1.numerator(ratio), denominator_1.denominator(ratio)].map(misc_1.yyexpand);
    if (parts.some((p) => find_1.Find(p, x) && !is_1.ispolyexpandedform(p, x))) {
        return null;
    }
    let [a, b] = parts.map((p) => build(coeffs(p)));
    let c = c0;
    if (find_1.Find(a, x) && find_1.Find(b, x)) {
        if (coeffs(a).length + coeffs(b).length - 2 > MAX_SYLVESTER) {
            return null;
        }
        const h = symbol_1.symbol(defs_1.SECRETX);
        const R = resultant_1.resultant(a, shift(b, h), x);
        for (let j = 0; j <= MAX_DISPERSION; j++) {
            if (!isZero(eval_1.Eval(subst_1.subst(R, h, bignum_1.integer(j))))) {
                continue;
            }
            const g = gcd(a, shift(b, bignum_1.integer(j)));
            if (!find_1.Find(g, x)) {
                continue;
            }
            a = build(coeffs(quotient_1.divpoly(a, g, x)));
            b = build(coeffs(quotient_1.divpoly(b, shift(g, bignum_1.integer(-j)), x)));
            for (let i = 1; i <= j; i++) {
                c = multiply_1.multiply(c, shift(g, bignum_1.integer(-i)));
            }
        }
    }
    const B = shift(b, defs_1.Constants.negOne);
    const [ca, cB, cc] = [a, B, c].map(coeffs);
    const d = ca.length - 1;
    let D = cc.length - 1 - Math.max(d, cB.length - 1);
    if (d === cB.length - 1 && isZero(add_1.subtract(ca[d], cB[d]))) {
        D = cc.length - d;
        if (d > 0) {
            const n0 = bignum_1.nativeInt(simplify_1.simplify(multiply_1.divide(add_1.subtract(cB[d - 1], ca[d - 1]), ca[d])));
            D = isNaN(n0) ? D : Math.max(D, n0);
        }
    }
    if (D < 0 || D > MAX_DEGREE) {
        return null;
    }
    // One column for the image of each x^j, the last one for c. Lowest powers
    // first: a free unknown is then a high power and X gets the lowest degree.
    const columns = Array.from({ length: D + 1 }, (_, j) => coeffs(add_1.subtract(multiply_1.multiply(a, power_1.power(add_1.add(x, defs_1.Constants.one), bignum_1.integer(j))), multiply_1.multiply(B, power_1.power(x, bignum_1.integer(j)))))).concat([cc]);
    const rows = Math.max(...columns.map((col) => col.length));
    const X = solveLinear(Array.from({ length: rows }, (_, i) => columns.map((col) => { var _a; return (_a = col[i]) !== null && _a !== void 0 ? _a : defs_1.Constants.zero; })), D + 1);
    if (!X) {
        return null;
    }
    // simplify does not cancel a common factor such as x^2+x-1
    // ponytail: with parameters in the coefficients Euclid's algorithm swells
    // beyond use (x^3*y^x), the fraction is then left to simplify
    const w = rationalize_1.rationalize(whole);
    const num = build(coeffs(multiply_1.multiply(multiply_1.multiply(B, build(X)), numerator_1.numerator(w))));
    const den = build(coeffs(multiply_1.multiply(c, denominator_1.denominator(w))));
    const numeric = [num, den].every((p) => coeffs(p).every(defs_1.isrational));
    const g = numeric ? gcd(num, den) : defs_1.Constants.one;
    return simplify_1.simplify(multiply_1.multiply(multiply_1.divide(quotient_1.divpoly(num, g, x), quotient_1.divpoly(den, g, x)), multiply_1.multiply(c0, terms[0])));
}
exports.gosper = gosper;
// Gauss-Jordan elimination of the augmented matrix M with n unknowns, free
// unknowns are set to 0; null for an inconsistent system.
function solveLinear(M, n) {
    const pivotRow = [];
    let row = 0;
    for (let col = 0; col < n; col++) {
        const p = M.findIndex((r, i) => i >= row && !isZero(r[col]));
        if (p < 0) {
            pivotRow.push(-1);
            continue;
        }
        [M[row], M[p]] = [M[p], M[row]];
        const pivot = M[row][col];
        M[row] = M[row].map((v) => simplify_1.simplify(multiply_1.divide(v, pivot)));
        M.forEach((r, i) => {
            if (i !== row && !isZero(r[col])) {
                const f = r[col];
                M[i] = r.map((v, j) => simplify_1.simplify(add_1.subtract(v, multiply_1.multiply(f, M[row][j]))));
            }
        });
        pivotRow.push(row++);
    }
    if (M.slice(row).some((r) => !isZero(r[n]))) {
        return null;
    }
    return pivotRow.map((p) => (p < 0 ? defs_1.Constants.zero : M[p][n]));
}
