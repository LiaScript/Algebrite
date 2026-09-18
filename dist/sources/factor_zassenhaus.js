"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.factorZ = exports.zDivExact = exports.zMul = void 0;
const big_integer_1 = __importDefault(require("big-integer"));
const run_1 = require("../runtime/run");
const ZERO = big_integer_1.default.zero;
const ONE = big_integer_1.default.one;
// ponytail: recombination is exponential when a factor needs many modular
// factors (an irreducible polynomial that splits modulo every prime); after
// this many products have been tried the polynomial is returned unfactored
// (van Hoeij's lattice method would lift the limit)
const MAX_TRIALS = 100000;
const PRIMES = [
    3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73,
    79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151,
];
// --- Z[x] --------------------------------------------------------------------
function zTrim(a) {
    while (a.length && a[a.length - 1].isZero()) {
        a.pop();
    }
    return a;
}
const zDeg = (a) => a.length - 1;
const zLc = (a) => a[a.length - 1];
function zSub(a, b) {
    const r = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        r.push((a[i] || ZERO).subtract(b[i] || ZERO));
    }
    return zTrim(r);
}
function zMul(a, b) {
    if (!a.length || !b.length) {
        return [];
    }
    run_1.check_esc_flag();
    const r = new Array(a.length + b.length - 1).fill(ZERO);
    for (let i = 0; i < a.length; i++) {
        if (a[i].isZero()) {
            continue;
        }
        for (let j = 0; j < b.length; j++) {
            r[i + j] = r[i + j].add(a[i].multiply(b[j]));
        }
    }
    return r;
}
exports.zMul = zMul;
function zDeriv(a) {
    return zTrim(a.slice(1).map((c, i) => c.multiply(i + 1)));
}
// a/b if b divides a in Z[x], else null
function zDivExact(a, b) {
    if (a.length < b.length) {
        return a.length ? null : [];
    }
    const r = a.slice();
    const q = new Array(a.length - b.length + 1);
    const lb = zLc(b);
    for (let k = q.length - 1; k >= 0; k--) {
        const { quotient, remainder } = r[k + b.length - 1].divmod(lb);
        if (!remainder.isZero()) {
            return null;
        }
        q[k] = quotient;
        if (!quotient.isZero()) {
            for (let j = 0; j < b.length; j++) {
                r[k + j] = r[k + j].subtract(quotient.multiply(b[j]));
            }
        }
    }
    return r.every((c) => c.isZero()) ? q : null;
}
exports.zDivExact = zDivExact;
// the gcd of two numbers with thousands of digits takes its time, and
// nothing inside the library call can be interrupted
const zContent = (a) => a.reduce((g, c) => {
    run_1.check_esc_flag();
    return g.equals(1) ? g : big_integer_1.default.gcd(g, c);
}, ZERO);
// content removed, leading coefficient positive
function zPrimitive(a) {
    if (!a.length) {
        return a;
    }
    let c = zContent(a);
    if (zLc(a).isNegative()) {
        c = c.negate();
    }
    return a.map((x) => x.divide(c));
}
// remainder of lc(b)^k * a by b
function zPseudoRem(a, b) {
    let r = a.slice();
    const lb = zLc(b);
    while (r.length >= b.length) {
        run_1.check_esc_flag();
        const lr = zLc(r);
        const shift = r.length - b.length;
        r = r.map((c, i) => c
            .multiply(lb)
            .subtract(i >= shift ? lr.multiply(b[i - shift]) : ZERO));
        zTrim(r);
    }
    return r;
}
// primitive remainder sequence
function zGcd(a, b) {
    a = zPrimitive(a);
    b = zPrimitive(b);
    while (b.length) {
        run_1.check_esc_flag();
        const r = zPrimitive(zPseudoRem(a, b));
        a = b;
        b = r;
    }
    return a;
}
// Yun: f primitive -> [[f1,1],[f2,2],...] with f = f1*f2^2*..., fi square-free
function squareFree(f) {
    const out = [];
    const df = zDeriv(f);
    // Square-free modulo one prime that keeps the degree means square-free:
    // the usual case, and it saves the gcd over Z, whose coefficients grow
    // (12 s at degree 128).
    for (const p of PRIMES) {
        const fp = fFromZ(f, p);
        if (fp.length === f.length && fGcd(fp, fFromZ(df, p), p).length === 1) {
            return [[f, 1]];
        }
    }
    const c = zGcd(f, df);
    let w = zDivExact(f, c);
    let y = zDivExact(df, c);
    let z = zSub(y, zDeriv(w));
    let i = 1;
    while (z.length) {
        const g = zGcd(w, z);
        if (zDeg(g) > 0) {
            out.push([g, i]);
        }
        w = zDivExact(w, g);
        y = zDivExact(z, g);
        z = zSub(y, zDeriv(w));
        i++;
    }
    if (zDeg(w) > 0) {
        out.push([zPrimitive(w), i]);
    }
    return out;
}
// --- F_p[x], p a small odd prime --------------------------------------------
function fTrim(a) {
    while (a.length && a[a.length - 1] === 0) {
        a.pop();
    }
    return a;
}
function fInv(a, p) {
    let [r0, r1, s0, s1] = [p, ((a % p) + p) % p, 0, 1];
    while (r1) {
        const q = Math.floor(r0 / r1);
        [r0, r1, s0, s1] = [r1, r0 - q * r1, s1, s0 - q * s1];
    }
    return ((s0 % p) + p) % p;
}
const fFromZ = (a, p) => fTrim(a.map((c) => (c.mod(p).toJSNumber() + p) % p));
function fSub(a, b, p) {
    const r = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        r.push((((a[i] || 0) - (b[i] || 0)) % p + p) % p);
    }
    return fTrim(r);
}
function fMul(a, b, p) {
    if (!a.length || !b.length) {
        return [];
    }
    const r = new Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b.length; j++) {
            r[i + j] = (r[i + j] + a[i] * b[j]) % p;
        }
    }
    return fTrim(r);
}
function fDivmod(a, b, p) {
    const r = a.slice();
    const q = new Array(Math.max(0, a.length - b.length + 1)).fill(0);
    const inv = fInv(b[b.length - 1], p);
    for (let k = q.length - 1; k >= 0; k--) {
        const c = (r[k + b.length - 1] * inv) % p;
        q[k] = c;
        if (c) {
            for (let j = 0; j < b.length; j++) {
                r[k + j] = (((r[k + j] - c * b[j]) % p) + p) % p;
            }
        }
    }
    return [fTrim(q), fTrim(r)];
}
const fMonic = (a, p) => {
    const inv = a.length ? fInv(a[a.length - 1], p) : 1;
    return a.map((c) => (c * inv) % p);
};
function fGcd(a, b, p) {
    while (b.length) {
        [a, b] = [b, fDivmod(a, b, p)[1]];
    }
    return fMonic(a, p);
}
// s*a + t*b = 1 for coprime a, b
function fBezout(a, b, p) {
    let [r0, r1] = [a, b];
    let [s0, s1] = [[1], []];
    let [t0, t1] = [[], [1]];
    while (r1.length) {
        const [q, r] = fDivmod(r0, r1, p);
        [r0, r1] = [r1, r];
        [s0, s1] = [s1, fSub(s0, fMul(q, s1, p), p)];
        [t0, t1] = [t1, fSub(t0, fMul(q, t1, p), p)];
    }
    const inv = fInv(r0[0], p);
    return [s0.map((c) => (c * inv) % p), t0.map((c) => (c * inv) % p)];
}
function fPowMod(base, e, f, p) {
    let result = [1];
    let b = fDivmod(base, f, p)[1];
    while (!e.isZero()) {
        run_1.check_esc_flag();
        if (e.isOdd()) {
            result = fDivmod(fMul(result, b, p), f, p)[1];
        }
        b = fDivmod(fMul(b, b, p), f, p)[1];
        e = e.shiftRight(1);
    }
    return result;
}
const fDeriv = (a, p) => fTrim(a.slice(1).map((c, i) => (c * (i + 1)) % p));
// distinct degrees: [[product of the irreducible factors of degree d, d], ...]
function distinctDegree(f, p) {
    const out = [];
    let h = [0, 1];
    let d = 0;
    while (f.length - 1 >= 2 * (d + 1)) {
        d++;
        h = fPowMod(h, big_integer_1.default(p), f, p);
        const g = fGcd(fSub(h, [0, 1], p), f, p);
        if (g.length > 1) {
            out.push([g, d]);
            f = fDivmod(f, g, p)[0];
            h = fDivmod(h, f, p)[1];
        }
    }
    if (f.length > 1) {
        out.push([f, f.length - 1]);
    }
    return out;
}
// Cantor-Zassenhaus: f is a product of irreducibles of degree d
function equalDegree(f, d, p, seed) {
    if (f.length - 1 === d) {
        return [fMonic(f, p)];
    }
    const e = big_integer_1.default(p).pow(d).subtract(1).divide(2);
    while (true) {
        const t = [];
        for (let i = 0; i < f.length - 1; i++) {
            // a fixed linear congruential sequence: same result on every run
            seed[0] = (seed[0] * 69069 + 1) % 2147483648;
            t.push((seed[0] >>> 16) % p);
        }
        fTrim(t);
        if (t.length < 2) {
            continue;
        }
        const g = fGcd(fSub(fPowMod(t, e, f, p), [1], p), f, p);
        if (g.length > 1 && g.length < f.length) {
            return [
                ...equalDegree(g, d, p, seed),
                ...equalDegree(fDivmod(f, g, p)[0], d, p, seed),
            ];
        }
    }
}
// --- Hensel lifting ------------------------------------------------------------
const mMod = (a, m) => zTrim(a.map((c) => {
    const r = c.mod(m);
    return r.isNegative() ? r.add(m) : r;
}));
const mAdd = (a, b) => {
    const r = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        r.push((a[i] || ZERO).add(b[i] || ZERO));
    }
    return r;
};
// division by a monic polynomial, coefficients modulo m
function mDivmod(a, b, m) {
    const r = mMod(a, m);
    const n = Math.max(0, r.length - b.length + 1);
    const q = new Array(n).fill(ZERO);
    for (let k = n - 1; k >= 0; k--) {
        const c = (r[k + b.length - 1] || ZERO).mod(m);
        q[k] = c;
        if (!c.isZero()) {
            for (let j = 0; j < b.length; j++) {
                r[k + j] = r[k + j].subtract(c.multiply(b[j])).mod(m);
            }
        }
    }
    return [mMod(q, m), mMod(r.slice(0, b.length - 1), m)];
}
// f = g*h and s*g + t*h = 1 modulo m  ->  the same modulo m^2 (h monic)
function henselStep(f, g, h, s, t, m) {
    const m2 = m.multiply(m);
    const e = mMod(zSub(f, zMul(g, h)), m2);
    const [q, r] = mDivmod(zMul(s, e), h, m2);
    const g2 = mMod(mAdd(mAdd(g, zMul(t, e)), zMul(q, g)), m2);
    const h2 = mMod(mAdd(h, r), m2);
    const b = mMod(zSub(mAdd(zMul(s, g2), zMul(t, h2)), [ONE]), m2);
    const [c, d] = mDivmod(zMul(s, b), h2, m2);
    const s2 = mMod(zSub(s, d), m2);
    const t2 = mMod(zSub(zSub(t, zMul(t, b)), zMul(c, g2)), m2);
    return [g2, h2, s2, t2];
}
// f monic, f = product of the monic factors modulo p  ->  the factors modulo
// p^(2^steps)
function henselLift(f, factors, p, steps) {
    if (factors.length === 1) {
        let m = big_integer_1.default(p);
        for (let i = 0; i < steps; i++) {
            m = m.multiply(m);
        }
        return [mMod(f, m)];
    }
    const half = factors.length >> 1;
    const prod = (fs) => fs.reduce((a, b) => fMul(a, b, p), [1]);
    const gp = prod(factors.slice(0, half));
    const hp = prod(factors.slice(half));
    const [sp, tp] = fBezout(gp, hp, p);
    let [g, h, s, t] = [gp, hp, sp, tp].map((a) => a.map((c) => big_integer_1.default(c)));
    let m = big_integer_1.default(p);
    for (let i = 0; i < steps; i++) {
        [g, h, s, t] = henselStep(f, g, h, s, t, m);
        m = m.multiply(m);
    }
    return [
        ...henselLift(g, factors.slice(0, half), p, steps),
        ...henselLift(h, factors.slice(half), p, steps),
    ];
}
// --- recombination -------------------------------------------------------------
const symmetric = (a, m) => {
    const half = m.shiftRight(1);
    return zTrim(mMod(a, m).map((c) => (c.compare(half) > 0 ? c.subtract(m) : c)));
};
// all k-element subsets of 0..n-1, in lexicographic order
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
function recombine(F, lifted, m) {
    const out = [];
    let rest = lifted;
    let k = 1;
    let trials = 0;
    search: while (2 * k <= rest.length) {
        for (const idx of subsets(rest.length, k)) {
            run_1.check_esc_flag();
            if (++trials > MAX_TRIALS) {
                return undefined;
            }
            // cheap test first: the constant term has to divide F(0)
            const c0 = symmetric([idx.reduce((c, i) => c.multiply(rest[i][0] || ZERO).mod(m), ONE)], m);
            if (!c0.length || !F[0].mod(c0[0]).isZero()) {
                continue;
            }
            const G = symmetric(idx.reduce((g, i) => mMod(zMul(g, rest[i]), m), [ONE]), m);
            const Q = zDivExact(F, G);
            if (Q) {
                out.push(G);
                F = Q;
                rest = rest.filter((_, i) => idx.indexOf(i) < 0);
                continue search;
            }
        }
        k++;
    }
    if (zDeg(F) > 0) {
        out.push(F);
    }
    return out;
}
// irreducible factors of a primitive square-free f with f(0) != 0, or
// undefined when the search would take too long
function factorSquareFree(f) {
    var _a;
    const n = zDeg(f);
    if (n < 2) {
        return [f];
    }
    // monic: F(y) = lc^(n-1) * f(y/lc)
    const lc = zLc(f);
    const F = f.map((c, i) => (i === n ? ONE : c.multiply(lc.pow(n - 1 - i))));
    let best;
    let tried = 0;
    for (const p of PRIMES) {
        const Fp = fFromZ(F, p);
        if (fGcd(Fp, fDeriv(Fp, p), p).length > 1) {
            continue;
        }
        const parts = distinctDegree(Fp, p);
        const count = parts.reduce((s, [g, d]) => s + (g.length - 1) / d, 0);
        if (!best || count < best.count) {
            best = { p, parts, count };
        }
        if (count === 1) {
            return [f];
        }
        // more primes for bigger polynomials: fewer modular factors pay off
        if (++tried >= (n > 20 ? 12 : 6)) {
            break;
        }
    }
    if (!best) {
        return undefined;
    }
    const { p, parts } = best;
    const seed = [12345];
    const modular = [];
    for (const [g, d] of parts) {
        modular.push(...equalDegree(g, d, p, seed));
    }
    // Mignotte: a coefficient of a factor is at most 2^n * |F|
    const norm = F.reduce((s, c) => s.add(c.abs()), ZERO);
    const bound = norm.multiply(big_integer_1.default(2).pow(n + 1));
    let steps = 0;
    let m = big_integer_1.default(p);
    while (m.compare(bound) <= 0) {
        m = m.multiply(m);
        steps++;
    }
    const lifted = henselLift(F, modular, p, steps);
    // back from y = lc*x
    return (_a = recombine(F, lifted, m)) === null || _a === void 0 ? void 0 : _a.map((G) => zPrimitive(G.map((c, i) => c.multiply(lc.pow(i)))));
}
// f(x) = g(x^p): the irreducible factors of f are those of the h(x^p), h an
// irreducible factor of g. x^120-1 has more than 40 factors modulo every
// prime, which recombination cannot handle; y^2-1 has two, and so on down.
function factorSparse(f) {
    const gcd2 = (a, b) => (b ? gcd2(b, a % b) : a);
    const k = f.reduce((g, c, i) => (c.isZero() ? g : gcd2(g, i)), 0);
    if (k < 2) {
        return factorSquareFree(f);
    }
    let p = 2;
    while (k % p) {
        p++;
    }
    const inner = factorSparse(f.filter((_, i) => i % p === 0));
    if (!inner) {
        return undefined;
    }
    const out = [];
    for (const h of inner) {
        const inflated = [];
        h.forEach((c, i) => {
            inflated[i * p] = c;
        });
        for (let i = 0; i < inflated.length; i++) {
            inflated[i] = inflated[i] || ZERO;
        }
        const parts = factorSquareFree(inflated);
        if (!parts) {
            return undefined;
        }
        out.push(...parts);
    }
    return out;
}
// smaller degree first, then the bigger coefficient from the top
function byDegreeThenCoefficients(a, b) {
    if (a.length !== b.length) {
        return a.length - b.length;
    }
    for (let i = a.length - 1; i >= 0; i--) {
        const c = b[i].compare(a[i]);
        if (c) {
            return c;
        }
    }
    return 0;
}
// f = content * x^k * product of irreducible factors; undefined when a
// square-free part could not be split within the limits
function factorZ(f) {
    f = zTrim(f.slice());
    let content = zContent(f);
    if (f.length && zLc(f).isNegative()) {
        content = content.negate();
    }
    f = f.map((c) => c.divide(content));
    const factors = [];
    const k = f.findIndex((c) => !c.isZero());
    if (k > 0) {
        factors.push([[ZERO, ONE], k]);
        f = f.slice(k);
    }
    if (zDeg(f) < 1) {
        return { content, factors };
    }
    for (const [g, mult] of squareFree(f)) {
        const irreducible = factorSparse(g);
        if (!irreducible) {
            return undefined;
        }
        irreducible.sort(byDegreeThenCoefficients);
        irreducible.forEach((h) => factors.push([h, mult]));
    }
    return { content, factors };
}
exports.factorZ = factorZ;
