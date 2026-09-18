"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mpPrimitive = exports.mpReduce = exports.monic = exports.divides = exports.mpMulTerm = exports.mpSub = exports.fromMPoly = exports.toMPoly = exports.ORDERS = void 0;
const big_integer_1 = __importDefault(require("big-integer"));
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const is_1 = require("./is");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const power_1 = require("./power");
const qadd_1 = require("./qadd");
const qdiv_1 = require("./qdiv");
const qmul_1 = require("./qmul");
const deg = (a) => a.reduce((s, x) => s + x, 0);
function lex(a, b) {
    const i = a.findIndex((x, k) => x !== b[k]);
    return i < 0 ? 0 : a[i] - b[i];
}
exports.ORDERS = {
    lex,
    grlex: (a, b) => deg(a) - deg(b) || lex(a, b),
    // same degree: the smaller exponent in the last differing variable wins
    grevlex: (a, b) => {
        const d = deg(a) - deg(b);
        if (d)
            return d;
        for (let i = a.length - 1; i >= 0; i--) {
            if (a[i] !== b[i])
                return b[i] - a[i];
        }
        return 0;
    },
};
// Sorts, merges equal monomials and drops zero coefficients.
function normalize(p, ord) {
    const out = [];
    for (const t of [...p].sort((s, t) => ord(t.e, s.e))) {
        const last = out[out.length - 1];
        if (last && ord(last.e, t.e) === 0) {
            out[out.length - 1] = { e: last.e, c: qadd_1.qadd(last.c, t.c) };
        }
        else {
            out.push(t);
        }
    }
    return out.filter((t) => !t.c.a.isZero());
}
function toMPoly(p, vars, ord) {
    const expanded = misc_1.yyexpand(p);
    const terms = [];
    for (const t of defs_1.isadd(expanded) ? expanded.tail() : [expanded]) {
        let c = defs_1.Constants.one;
        const e = vars.map(() => 0);
        for (const f of defs_1.ismultiply(t) ? t.tail() : [t]) {
            if (defs_1.isrational(f)) {
                c = qmul_1.qmul(c, f);
                continue;
            }
            const [base, n] = defs_1.ispower(f) ? [defs_1.cadr(f), defs_1.caddr(f)] : [f, defs_1.Constants.one];
            const i = vars.indexOf(base);
            if (i < 0 || !is_1.isinteger(n) || n.a.isNegative()) {
                run_1.stop(`groebner: ${p} is not a polynomial with rational coefficients in ${vars.join(',')}`);
            }
            e[i] += n.a.toJSNumber();
        }
        terms.push({ e, c });
    }
    return normalize(terms, ord);
}
exports.toMPoly = toMPoly;
function fromMPoly(p, vars) {
    return p.reduce((sum, t) => add_1.add(sum, t.e.reduce((m, x, i) => multiply_1.multiply(m, power_1.power(vars[i], bignum_1.integer(x))), t.c)), defs_1.Constants.zero);
}
exports.fromMPoly = fromMPoly;
const mpSub = (p, q, ord) => normalize(p.concat(q.map((t) => ({ e: t.e, c: qmul_1.qmul(t.c, defs_1.Constants.negOne) }))), ord);
exports.mpSub = mpSub;
// c*x^e*p; a monomial order is kept by multiplication
const mpMulTerm = (p, c, e) => p.map((t) => ({ e: t.e.map((x, i) => x + e[i]), c: qmul_1.qmul(t.c, c) }));
exports.mpMulTerm = mpMulTerm;
const divides = (a, b) => a.every((x, i) => x <= b[i]);
exports.divides = divides;
const monic = (p) => exports.mpMulTerm(p, qdiv_1.qdiv(defs_1.Constants.one, p[0].c), p[0].e.map(() => 0));
exports.monic = monic;
// Remainder of the division of f by the polynomials in G: no term of the
// result is divisible by a leading monomial of G.
function mpReduce(f, G, ord) {
    const r = [];
    let p = f;
    while (p.length) {
        const t = p[0];
        const g = G.find((g) => exports.divides(g[0].e, t.e));
        if (g) {
            const q = qdiv_1.qdiv(t.c, g[0].c);
            p = exports.mpSub(p, exports.mpMulTerm(g, q, t.e.map((x, i) => x - g[0].e[i])), ord);
        }
        else {
            r.push(t);
            p = p.slice(1);
        }
    }
    return r;
}
exports.mpReduce = mpReduce;
// Integer coefficients without common factor, sign of the leading one kept.
function mpPrimitive(p) {
    const den = p.reduce((l, t) => big_integer_1.default.lcm(l, t.c.b), big_integer_1.default.one);
    const num = p.reduce((g, t) => big_integer_1.default.gcd(g, t.c.a), big_integer_1.default.zero);
    return exports.mpMulTerm(p, qdiv_1.qdiv(new defs_1.Num(den), new defs_1.Num(num)), p[0].e.map(() => 0));
}
exports.mpPrimitive = mpPrimitive;
