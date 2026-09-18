"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.factorKronecker = void 0;
const big_integer_1 = __importDefault(require("big-integer"));
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const factor_zassenhaus_1 = require("./factor_zassenhaus");
const mpoly_1 = require("./mpoly");
const power_1 = require("./power");
const bignum_1 = require("./bignum");
const qdiv_1 = require("./qdiv");
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
const ord = mpoly_1.ORDERS.lex;
// f/g if g divides f, with integer coefficients
function mpDivExact(f, g) {
    const q = [];
    let p = f;
    while (p.length) {
        run_1.check_esc_flag();
        const t = p[0];
        if (!mpoly_1.divides(g[0].e, t.e)) {
            return;
        }
        const c = qdiv_1.qdiv(t.c, g[0].c);
        if (!c.b.equals(1)) {
            return;
        }
        const e = t.e.map((x, i) => x - g[0].e[i]);
        q.push({ e, c });
        p = mpoly_1.mpSub(p, mpoly_1.mpMulTerm(g, c, e), ord);
    }
    return q;
}
function* subsets(n, k) {
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
function factorKronecker(p, X) {
    const vars = [];
    symbol_1.collectUserSymbols(p, vars);
    if (vars.length < 2 || vars.indexOf(X) < 0) {
        return;
    }
    vars.splice(vars.indexOf(X), 1);
    vars.unshift(X);
    let P;
    try {
        P = mpoly_1.toMPoly(p, vars, ord);
    }
    catch (error) {
        // sin(y), y^(1/2), 1/y: not a polynomial
        return;
    }
    if (P.length < 2) {
        return;
    }
    const primitive = mpoly_1.mpPrimitive(P);
    let content = qdiv_1.qdiv(P[0].c, primitive[0].c);
    P = primitive;
    // powers of single variables
    const out = [];
    const low = vars.map((_, i) => Math.min(...P.map((t) => t.e[i])));
    low.forEach((k, i) => k && out.push(power_1.power(vars[i], bignum_1.integer(k))));
    P = P.map((t) => ({ e: t.e.map((x, i) => x - low[i]), c: t.c }));
    const radix = vars.map((_, i) => 1 + Math.max(...P.map((t) => t.e[i])));
    const weight = radix.map((_, i) => radix.slice(0, i).reduce((a, b) => a * b, 1));
    if (radix.reduce((a, b) => a * b, 1) - 1 > MAX_IMAGE_DEGREE) {
        return;
    }
    const image = [];
    for (const t of P) {
        image[t.e.reduce((s, x, i) => s + x * weight[i], 0)] = t.c.a;
    }
    for (let i = 0; i < image.length; i++) {
        image[i] = image[i] || big_integer_1.default.zero;
    }
    const factored = factor_zassenhaus_1.factorZ(image);
    if (!factored) {
        return;
    }
    let rest = [];
    for (const [g, mult] of factored.factors) {
        for (let k = 0; k < mult; k++) {
            rest.push(g);
        }
    }
    if (rest.length > MAX_IMAGE_FACTORS) {
        return;
    }
    const back = (G) => {
        const terms = [];
        G.forEach((c, E) => {
            if (!c.isZero()) {
                const e = radix.map((r) => {
                    const digit = E % r;
                    E = Math.floor(E / r);
                    return digit;
                });
                terms.push({ e, c: new defs_1.Num(c) });
            }
        });
        const h = mpoly_1.mpNormalize(terms, ord);
        return h[0].c.a.isNegative() ? mpoly_1.mpMulTerm(h, defs_1.Constants.negOne, h[0].e.map(() => 0)) : h;
    };
    const found = [];
    let k = 1;
    search: while (k < rest.length) {
        for (const idx of subsets(rest.length, k)) {
            const h = back(idx.reduce((G, i) => factor_zassenhaus_1.zMul(G, rest[i]), [big_integer_1.default.one]));
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
        content = qdiv_1.qdiv(content, qdiv_1.qdiv(defs_1.Constants.one, P[0].c));
    }
    else {
        found.push(P);
    }
    return [content, ...out, ...found.map((h) => mpoly_1.fromMPoly(h, vars))];
}
exports.factorKronecker = factorKronecker;
