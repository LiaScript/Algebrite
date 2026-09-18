"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gcdMultivariate = void 0;
const big_integer_1 = __importDefault(require("big-integer"));
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const bignum_1 = require("./bignum");
const mpoly_1 = require("./mpoly");
const multiply_1 = require("./multiply");
const qdiv_1 = require("./qdiv");
const qmul_1 = require("./qmul");
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
const ord = mpoly_1.ORDERS.lex;
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
function spend(n) {
    work -= n;
    if (work < 0) {
        throw new Error('gcd: too big');
    }
}
const degree = (p, k) => (p.length ? p[0].e[k] : -1);
function mpMul(p, q) {
    spend(p.length * q.length);
    return mpoly_1.mpNormalize(q.reduce((acc, t) => acc.concat(mpoly_1.mpMulTerm(p, t.c, t.e)), []), ord);
}
// f/g, g divides f
function mpDivExact(f, g) {
    const q = [];
    let p = f;
    while (p.length) {
        run_1.check_esc_flag();
        spend(g.length);
        const t = p[0];
        if (!mpoly_1.divides(g[0].e, t.e)) {
            throw new Error('gcd: inexact division');
        }
        const c = qdiv_1.qdiv(t.c, g[0].c);
        const e = t.e.map((x, i) => x - g[0].e[i]);
        q.push({ e, c });
        p = mpoly_1.mpSub(p, mpoly_1.mpMulTerm(g, c, e), ord);
    }
    return q;
}
// The coefficients of p as a polynomial in variable k, highest power first.
function coefficients(p, k) {
    const out = [];
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
const isConstant = (p) => p.length === 1 && p[0].e.every((x) => x === 0);
function content(p, k) {
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
const primitivePart = (p, k) => mpoly_1.mpPrimitive(mpDivExact(p, content(p, k)));
// Pseudo-remainder of a by b in variable k, up to a rational factor
function pseudoRemainder(a, b, k) {
    const lb = coefficients(b, k)[0];
    while (degree(a, k) >= degree(b, k)) {
        run_1.check_esc_flag();
        const shift = a[0].e.map((_, i) => (i === k ? degree(a, k) - degree(b, k) : 0));
        const la = coefficients(a, k)[0];
        a = mpoly_1.mpSub(mpMul(a, lb), mpoly_1.mpMulTerm(mpMul(b, la), defs_1.Constants.one, shift), ord);
        // any rational multiple will do, and the numbers stay small
        a = a.length ? mpoly_1.mpPrimitive(a) : a;
    }
    return a;
}
// p as a polynomial in variable k alone, the variables after it set to the
// integers of point; undefined when that lowers the degree
function image(p, k, point) {
    const at = (t) => ({
        e: t.e.map((x, i) => (i === k ? x : 0)),
        c: t.e.reduce((c, x, i) => (i > k ? qmul_1.qmul(c, new defs_1.Num(big_integer_1.default(point[i % point.length]).pow(x))) : c), t.c),
    });
    const q = mpoly_1.mpNormalize(p.map(at), ord);
    return degree(q, k) === degree(p, k) ? q : undefined;
}
function coprimeImages(a, b, k) {
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
function mpGcd(f, g, k) {
    if (!f.length || !g.length) {
        return f.length ? f : g;
    }
    if (k === f[0].e.length || isConstant(f) || isConstant(g)) {
        return [{ e: f[0].e.map(() => 0), c: defs_1.Constants.one }];
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
function sortKey(v) {
    const i = ['x', 'y', 'z', 't', 's'].indexOf(v.toString());
    return i < 0 ? '1' + v : '0' + i;
}
// The gcd of two polynomials with rational coefficients in two or more
// symbols, at least one of them a sum and the other one a sum or a monomial:
// primitive with a positive leading coefficient, times the gcd of the numeric
// contents. undefined for anything else (functions, symbolic or fractional
// exponents, floats, factored arguments, which keep their factors).
function gcdMultivariate(p1, p2) {
    // no sum inside a product or power: toMPoly would expand it
    const monomial = (p) => (defs_1.ismultiply(p) ? p.tail() : [p]).every((f) => !defs_1.iscons(f) || (defs_1.ispower(f) && !defs_1.iscons(defs_1.cadr(f))));
    if ((!defs_1.isadd(p1) && !defs_1.isadd(p2)) ||
        ![p1, p2].every((p) => defs_1.isadd(p) || monomial(p))) {
        return;
    }
    const vars = [];
    symbol_1.collectUserSymbols(p1, vars);
    symbol_1.collectUserSymbols(p2, vars);
    if (vars.length < 2) {
        return;
    }
    vars.sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : 1));
    let P;
    let G;
    try {
        P = [p1, p2].map((p) => mpoly_1.toMPoly(p, vars, ord));
        work = WORK_LIMIT;
        G = mpoly_1.mpPrimitive(mpGcd(mpoly_1.mpPrimitive(P[0]), mpoly_1.mpPrimitive(P[1]), 0));
    }
    catch (error) {
        // not polynomials, or too big; a time limit that has passed stops again
        run_1.check_esc_flag();
        return;
    }
    if (G[0].c.a.isNegative()) {
        G = mpoly_1.mpMulTerm(G, defs_1.Constants.negOne, G[0].e.map(() => 0));
    }
    const numeric = P.map((p) => p.map((t) => t.c).reduce(bignum_1.gcd_numbers));
    return multiply_1.multiply(bignum_1.gcd_numbers(numeric[0], numeric[1]), mpoly_1.fromMPoly(G, vars));
}
exports.gcdMultivariate = gcdMultivariate;
