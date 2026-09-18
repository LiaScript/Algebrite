"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.certifiedSign = exports.bigFloat = exports.MAX_DIGITS = void 0;
const big_integer_1 = __importDefault(require("big-integer"));
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const float_1 = require("./float");
const is_1 = require("./is");
const list_1 = require("./list");
const multiply_1 = require("./multiply");
const tensor_1 = require("./tensor");
const zeta_1 = require("./zeta");
const GUARD = 25;
const MAX_ATTEMPTS = 6; // the precision doubles each time
exports.MAX_DIGITS = 1000;
class Fixed {
    // maxDigits bounds the size of exp, integer powers and series terms:
    // certifiedSign runs unasked, exp(exp(100)) or erf(1000) must fail
    // there instead of filling the memory
    constructor(P, maxDigits = Infinity) {
        this.P = P;
        this.maxDigits = maxDigits;
        this.S = big_integer_1.default(10).pow(P);
    }
    checkSize(digits) {
        if (!(digits <= this.maxDigits)) {
            throw new Error('out of reach');
        }
    }
    fromRatio(a, b) {
        return a.multiply(this.S).divide(b);
    }
    // the decimal a double prints as (0.1, not 0.1000000000000000055...)
    fromNumber(d) {
        const [mant, exp = '0'] = String(d).toLowerCase().split('e');
        const [int, frac = ''] = mant.replace('-', '').split('.');
        const digits = big_integer_1.default(int + frac);
        const e = parseInt(exp, 10) - frac.length + this.P;
        const value = e >= 0 ? digits.multiply(big_integer_1.default(10).pow(e)) : digits.divide(big_integer_1.default(10).pow(-e));
        return d < 0 ? value.negate() : value;
    }
    // leading digits only: good enough for starting values and reductions
    toNumber(a) {
        const s = a.abs().toString();
        const mant = Number(s.slice(0, 17));
        const e = s.length - Math.min(s.length, 17) - this.P;
        return (a.isNegative() ? -1 : 1) * mant * Math.pow(10, e);
    }
    mul(a, b) {
        return a.multiply(b).divide(this.S);
    }
    div(a, b) {
        if (b.isZero()) {
            throw new Error('division by zero');
        }
        return a.multiply(this.S).divide(b);
    }
    powInt(a, n) {
        if (n < 0) {
            return this.div(this.S, this.powInt(a, -n));
        }
        this.checkSize(n * Math.log10(Math.abs(this.toNumber(a)) || 1));
        let result = this.S;
        for (let base = a; n > 0; n = Math.floor(n / 2)) {
            if (n % 2 === 1) {
                result = this.mul(result, base);
            }
            base = this.mul(base, base);
        }
        return result;
    }
    // the q-th root of a > 0 by Newton: y <- ((q-1)*y + a/y^(q-1))/q
    root(a, q) {
        if (a.isZero()) {
            return a;
        }
        if (a.isNegative()) {
            throw new Error('root of a negative number');
        }
        let y = this.fromNumber(Math.pow(this.toNumber(a), 1 / q));
        for (let i = 0; i < 200; i++) {
            const next = y
                .multiply(q - 1)
                .add(this.div(a, this.powInt(y, q - 1)))
                .divide(q);
            const done = next.subtract(y).abs().leq(1);
            y = next;
            if (done) {
                break;
            }
        }
        return y;
    }
    // arctan(1/k) = sum (-1)^i / ((2i+1) k^(2i+1))
    arctanInverse(k) {
        let term = this.S.divide(k);
        let sum = term;
        for (let i = 1; !term.isZero(); i++) {
            term = term.divide(k * k);
            const t = term.divide(2 * i + 1);
            sum = i % 2 ? sum.subtract(t) : sum.add(t);
        }
        return sum;
    }
    // Machin: pi = 16*arctan(1/5) - 4*arctan(1/239)
    pi() {
        if (!this.piCache) {
            this.piCache = this.arctanInverse(5)
                .multiply(16)
                .subtract(this.arctanInverse(239).multiply(4));
        }
        return this.piCache;
    }
    // exp(x) = exp(x/2^k)^(2^k), the inner one from its series
    exp(x) {
        this.checkSize(Math.abs(this.toNumber(x)) * Math.LOG10E);
        const k = Math.max(0, Math.ceil(Math.log2(Math.abs(this.toNumber(x)) + 1)) + 8);
        const r = x.divide(big_integer_1.default(2).pow(k));
        let term = this.S;
        let sum = this.S;
        for (let i = 1; !term.isZero(); i++) {
            term = this.mul(term, r).divide(i);
            sum = sum.add(term);
        }
        for (let i = 0; i < k; i++) {
            sum = this.mul(sum, sum);
        }
        return sum;
    }
    // Newton on exp: y <- y + 2*(x - exp(y))/(x + exp(y))
    log(x) {
        if (!x.isPositive()) {
            throw new Error('log of a non-positive number');
        }
        const s = x.toString();
        const approx = Math.log(Number(s.slice(0, 17))) +
            (s.length - Math.min(s.length, 17) - this.P) * Math.LN10;
        let y = this.fromNumber(approx);
        for (let i = 0; i < 100; i++) {
            const e = this.exp(y);
            const delta = this.div(x.subtract(e).multiply(2), x.add(e));
            y = y.add(delta);
            if (delta.abs().leq(1)) {
                break;
            }
        }
        return y;
    }
    // x reduced to [-pi, pi], then the sine series
    sin(x) {
        const twoPi = this.pi().multiply(2);
        let r = x.mod(twoPi);
        if (r.gt(this.pi())) {
            r = r.subtract(twoPi);
        }
        else if (r.lt(this.pi().negate())) {
            r = r.add(twoPi);
        }
        const r2 = this.mul(r, r);
        let term = r;
        let sum = r;
        for (let i = 1; !term.isZero(); i++) {
            term = this.mul(term, r2).divide(2 * i * (2 * i + 1));
            sum = i % 2 ? sum.subtract(term) : sum.add(term);
        }
        return sum;
    }
    cos(x) {
        return this.sin(x.add(this.pi().divide(2)));
    }
    // abs(x) > 1 through pi/2 - arctan(1/x), then three halvings
    // arctan(x) = 2*arctan(x/(1+sqrt(1+x^2))) before the series
    arctan(x) {
        if (x.abs().gt(this.S)) {
            const half = this.pi().divide(2);
            return (x.isNegative() ? half.negate() : half).subtract(this.arctan(this.div(this.S, x)));
        }
        let r = x;
        for (let i = 0; i < 3; i++) {
            r = this.div(r, this.S.add(this.root(this.S.add(this.mul(r, r)), 2)));
        }
        const r2 = this.mul(r, r);
        let term = r;
        let sum = r;
        for (let i = 1; !term.isZero(); i++) {
            term = this.mul(term, r2);
            const t = term.divide(2 * i + 1);
            sum = i % 2 ? sum.subtract(t) : sum.add(t);
        }
        return sum.multiply(8);
    }
    // erf(x) = 2/sqrt(pi) * sum (-1)^k x^(2k+1)/(k!(2k+1)); the cancellation
    // for large x is caught by the precision check of bigFloat
    erf(x) {
        const x2 = this.mul(x, x);
        this.checkSize(this.toNumber(x2) * Math.LOG10E); // the largest term
        let term = x;
        let sum = x;
        for (let k = 1; !term.isZero(); k++) {
            term = this.mul(term, x2).divide(k);
            const t = term.divide(2 * k + 1);
            sum = k % 2 ? sum.subtract(t) : sum.add(t);
        }
        return this.div(sum.multiply(2), this.root(this.pi(), 2));
    }
    // Gamma(z): the argument is shifted up to at least P, where Stirling's
    // series log Gamma(w) = (w-1/2) log w - w + log(2 pi)/2
    //   + sum B_2k/(2k(2k-1) w^(2k-1)) converges to the working precision,
    // then divided back down; reflection for z < 0.
    gamma(z) {
        if (z.mod(this.S).isZero() && !z.isPositive()) {
            throw new Error('Gamma pole');
        }
        if (z.isNegative()) {
            // Gamma(z) = pi/(sin(pi z) Gamma(1-z))
            const s = this.sin(this.mul(this.pi(), z));
            return this.div(this.pi(), this.mul(s, this.gamma(this.S.subtract(z))));
        }
        let w = z;
        let shift = this.S;
        const target = this.S.multiply(Math.max(10, this.P));
        while (w.lt(target)) {
            shift = this.mul(shift, w);
            w = w.add(this.S);
        }
        let logGamma = this.mul(w.subtract(this.S.divide(2)), this.log(w))
            .subtract(w)
            .add(this.log(this.pi().multiply(2)).divide(2));
        const w2 = this.mul(w, w);
        let wPow = w; // w^(2k-1)
        for (let k = 1; k < 2000; k++) {
            const B = zeta_1.bernoulliNumber(2 * k);
            const term = this.div(this.fromRatio(B.a, B.b), wPow).divide(2 * k * (2 * k - 1));
            if (term.isZero()) {
                break;
            }
            logGamma = logGamma.add(term);
            wPow = this.mul(wPow, w2);
        }
        return this.div(this.exp(logGamma), shift);
    }
    // digamma(z) = psi(w) - sum_{k<n} 1/(z+k) with w = z+n at least P, where
    // psi(w) = log w - 1/(2w) - sum B_2k/(2k w^(2k)) reaches the working
    // precision (the terms fall to about exp(-2 pi w) before they grow);
    // reflection psi(z) = psi(1-z) - pi*cot(pi z) for z <= 0
    digamma(z) {
        if (!z.isPositive()) {
            if (z.mod(this.S).isZero()) {
                throw new Error('digamma pole');
            }
            const a = this.mul(this.pi(), z);
            return this.digamma(this.S.subtract(z)).subtract(this.div(this.mul(this.pi(), this.cos(a)), this.sin(a)));
        }
        let w = z;
        let shift = big_integer_1.default.zero;
        const target = this.S.multiply(Math.max(10, this.P));
        while (w.lt(target)) {
            shift = shift.add(this.div(this.S, w));
            w = w.add(this.S);
        }
        let psi = this.log(w).subtract(this.div(this.S, w).divide(2)).subtract(shift);
        const w2 = this.mul(w, w);
        let wPow = w2; // w^(2k)
        for (let k = 1; k < 2000; k++) {
            const B = zeta_1.bernoulliNumber(2 * k);
            const term = this.div(this.fromRatio(B.a, B.b), wPow).divide(2 * k);
            if (term.isZero()) {
                break;
            }
            psi = psi.subtract(term);
            wPow = this.mul(wPow, w2);
        }
        return psi;
    }
    eulerGamma() {
        return this.digamma(this.S).negate();
    }
    // zeta(s), s != 1, by Euler-Maclaurin with N = P:
    //   sum_{k<N} k^-s + N^(1-s)/(s-1) + N^-s/2 + sum_j T_j,
    //   T_j = B_2j/(2j)! * s(s+1)...(s+2j-2) * N^(1-s-2j)
    // The error is below the first omitted term once s+2j+1 > 0; the terms
    // fall to about exp(-2 pi N) N^-s, below the working precision, before
    // they grow again. powNeg(k) is k^-s.
    zeta(s, powNeg) {
        if (s.eq(this.S)) {
            throw new Error('zeta pole');
        }
        const N = Math.max(10, this.P);
        let sum = big_integer_1.default.zero;
        for (let k = 1; k < N; k++) {
            sum = sum.add(powNeg(k));
        }
        const Ns = powNeg(N);
        sum = sum.add(this.div(Ns.multiply(N), s.subtract(this.S))).add(Ns.divide(2));
        let rising = s; // s(s+1)...(s+2j-2)
        let scale = big_integer_1.default(2 * N); // (2j)! N^(2j-1)
        for (let j = 1;; j++) {
            const B = zeta_1.bernoulliNumber(2 * j);
            const term = this.mul(this.mul(this.fromRatio(B.a, B.b), rising), Ns).divide(scale);
            const bounded = s.add(this.S.multiply(2 * j + 1)).isPositive();
            if (term.isZero() && bounded) {
                return sum;
            }
            if (j > 4 * N) {
                throw new Error('zeta: no convergence'); // s far to the left
            }
            sum = sum.add(term);
            rising = this.mul(this.mul(rising, s.add(this.S.multiply(2 * j - 1))), s.add(this.S.multiply(2 * j)));
            scale = scale.multiply((2 * j + 1) * (2 * j + 2)).multiply(N * N);
        }
    }
    // sum_k (+-1)^k t_k/d(k) with t_0 = first and t_k = t_(k-1)*step/m(k).
    // The cancellation for a large argument is caught by the precision check
    // of bigFloat.
    series(first, step, m, d, alternating) {
        // the largest term: about exp(x), with step = x^2 in the alternating ones
        const size = Math.abs(this.toNumber(step));
        this.checkSize((alternating ? Math.sqrt(size) : size) * Math.LOG10E);
        let term = first;
        let sum = first.divide(d(0));
        for (let k = 1; !term.isZero(); k++) {
            term = this.mul(term, step).divide(m(k));
            const t = term.divide(d(k));
            sum = alternating && k % 2 ? sum.subtract(t) : sum.add(t);
        }
        return sum;
    }
    // Newton on w*exp(w) = x from a double precision start: both real
    // branches, the start decides which
    lambertw(x, start) {
        let w = this.fromNumber(start);
        for (let i = 0; i < 100; i++) {
            const e = this.exp(w);
            const delta = this.div(this.mul(w, e).subtract(x), this.mul(e, w.add(this.S)));
            w = w.subtract(delta);
            if (delta.abs().leq(1)) {
                break;
            }
        }
        return w;
    }
    arcsin(x) {
        if (x.abs().gt(this.S)) {
            throw new Error('arcsin outside [-1,1]');
        }
        if (x.abs().eq(this.S)) {
            const half = this.pi().divide(2);
            return x.isNegative() ? half.negate() : half;
        }
        return this.arctan(this.div(x, this.root(this.S.subtract(this.mul(x, x)), 2)));
    }
}
function evaluate(p, f) {
    if (defs_1.isrational(p)) {
        return f.fromRatio(p.a, p.b);
    }
    if (defs_1.isdouble(p)) {
        return f.fromNumber(p.d);
    }
    if (p === symbol_1.symbol(defs_1.PI)) {
        return f.pi();
    }
    if (p === symbol_1.symbol(defs_1.E)) {
        return f.exp(f.S);
    }
    if (defs_1.isadd(p)) {
        return p.tail().reduce((acc, t) => acc.add(evaluate(t, f)), big_integer_1.default.zero);
    }
    if (defs_1.ismultiply(p)) {
        return p.tail().reduce((acc, t) => f.mul(acc, evaluate(t, f)), f.S);
    }
    if (defs_1.ispower(p)) {
        const base = defs_1.cadr(p);
        const e = defs_1.caddr(p);
        if (base === symbol_1.symbol(defs_1.E)) {
            return f.exp(evaluate(e, f));
        }
        if (is_1.isinteger(e) && e.a.abs().lt(1e6)) {
            return f.powInt(evaluate(base, f), e.a.toJSNumber());
        }
        if (defs_1.isrational(e) && e.a.abs().lt(1e6) && e.b.lt(1e4)) {
            return f.powInt(f.root(evaluate(base, f), e.b.toJSNumber()), e.a.toJSNumber());
        }
        return f.exp(f.mul(evaluate(e, f), f.log(evaluate(base, f))));
    }
    if (defs_1.iscons(p) && defs_1.issymbol(defs_1.car(p))) {
        const name = defs_1.car(p).printname;
        const x = () => evaluate(defs_1.cadr(p), f);
        const expPair = () => {
            const ex = f.exp(x());
            return [ex, f.div(f.S, ex)];
        };
        switch (name) {
            case defs_1.SIN:
                return f.sin(x());
            case defs_1.COS:
                return f.cos(x());
            case defs_1.TAN:
                return f.div(f.sin(x()), f.cos(x()));
            case defs_1.ARCTAN:
                return f.arctan(x());
            case defs_1.ARCSIN:
                return f.arcsin(x());
            case defs_1.ARCCOS:
                return f.pi().divide(2).subtract(f.arcsin(x()));
            case defs_1.LOG:
                return f.log(x());
            case defs_1.GAMMA:
                return f.gamma(x());
            case defs_1.ERF:
                return f.erf(x());
            case defs_1.ERFC:
                return f.S.subtract(f.erf(x()));
            case defs_1.ABS:
                return x().abs();
            case defs_1.SINH: {
                const [a, b] = expPair();
                return a.subtract(b).divide(2);
            }
            case defs_1.COSH: {
                const [a, b] = expPair();
                return a.add(b).divide(2);
            }
            case defs_1.TANH: {
                const [a, b] = expPair();
                return f.div(a.subtract(b), a.add(b));
            }
            case defs_1.ARCSINH:
                return f.log(x().add(f.root(f.mul(x(), x()).add(f.S), 2)));
            case defs_1.ARCCOSH:
                return f.log(x().add(f.root(f.mul(x(), x()).subtract(f.S), 2)));
            case defs_1.ARCTANH:
                return f.log(f.div(f.S.add(x()), f.S.subtract(x()))).divide(2);
            case defs_1.FACTORIAL:
                return f.gamma(x().add(f.S));
            case defs_1.ZETA: {
                // k^-s through the power rules above: integer, root or exp(log)
                const zetaAt = (s) => f.zeta(evaluate(s, f), (k) => evaluate(list_1.makeList(symbol_1.symbol(defs_1.POWER), bignum_1.integer(k), multiply_1.negate(s)), f));
                const s = x();
                if (!s.isNegative()) {
                    return zetaAt(defs_1.cadr(p));
                }
                // zeta(s) = 2^s pi^(s-1) sin(pi s/2) Gamma(1-s) zeta(1-s): left of 0
                // Euler-Maclaurin would sum large terms that cancel
                const t = f.S.subtract(s);
                return [
                    f.exp(f.mul(s, f.log(f.S.multiply(2))).subtract(f.mul(t, f.log(f.pi())))),
                    f.sin(f.mul(f.pi(), s).divide(2)),
                    f.gamma(t),
                    zetaAt(add_1.add(defs_1.Constants.one, multiply_1.negate(defs_1.cadr(p))))
                ].reduce((a, b) => f.mul(a, b));
            }
            case 'digamma':
                return f.digamma(x());
            case 'lambertw': {
                const start = float_1.zzfloat(p);
                if (!defs_1.isdouble(start)) {
                    throw new Error('unsupported'); // not real
                }
                return f.lambertw(x(), start.d);
            }
            // Si(x) = sum (-1)^k x^(2k+1)/((2k+1)!(2k+1))
            case 'Si':
                return f.series(x(), f.mul(x(), x()), (k) => 2 * k * (2 * k + 1), (k) => 2 * k + 1, true);
            // Ci(x) = gamma + log(x) + sum_{k>=1} (-1)^k x^(2k)/((2k)!(2k)), the
            // series starts with a 1 for k = 0 that is taken off again
            case 'Ci':
                return f
                    .eulerGamma()
                    .add(f.log(x()))
                    .add(f.series(f.S, f.mul(x(), x()), (k) => (2 * k - 1) * 2 * k, (k) => 2 * k || 1, true))
                    .subtract(f.S);
            // Ei(x) = gamma + log|x| + sum_{k>=1} x^k/(k! k)
            case 'Ei':
                return f
                    .eulerGamma()
                    .add(f.log(x().abs()))
                    .add(f.series(f.S, x(), (k) => k, (k) => k || 1, false))
                    .subtract(f.S);
            // with u = pi x^2/2: S(x) = x sum (-1)^k u^(2k+1)/((2k+1)!(4k+3)),
            // C(x) = x sum (-1)^k u^(2k)/((2k)!(4k+1))
            case 'fresnels':
            case 'fresnelc': {
                const u = f.mul(f.pi(), f.mul(x(), x())).divide(2);
                const sum = name === 'fresnels'
                    ? f.series(u, f.mul(u, u), (k) => 2 * k * (2 * k + 1), (k) => 4 * k + 3, true)
                    : f.series(f.S, f.mul(u, u), (k) => (2 * k - 1) * 2 * k, (k) => 4 * k + 1, true);
                return f.mul(x(), sum);
            }
            // J_n(x) = (x/2)^n/n! sum (-1)^k (x^2/4)^k/(k! (n+1)...(n+k)),
            // J_(-n) = (-1)^n J_n
            case defs_1.BESSELJ: {
                const order = defs_1.cadr(p);
                if (!is_1.isinteger(order) || order.a.abs().gt(1000)) {
                    throw new Error('no arbitrary precision for besselj of this order');
                }
                const n = Math.abs(order.a.toJSNumber());
                const z = evaluate(defs_1.caddr(p), f);
                let first = f.powInt(z.divide(2), n);
                for (let k = 2; k <= n; k++) {
                    first = first.divide(k);
                }
                const J = f.series(first, f.mul(z, z).divide(4), (k) => k * (n + k), () => 1, true);
                return order.a.isNegative() && n % 2 ? J.negate() : J;
            }
        }
        throw new Error(`no arbitrary precision for ${name}`);
    }
    throw new Error('unsupported');
}
// n significant digits of a/10^P, rounded half up: plain decimals while the
// leading digit sits between 10^-6 and 10^n, d.ddd*10^e beyond
function format(a, P, n) {
    if (a.isZero()) {
        return '0.0';
    }
    const sign = a.isNegative() ? '-' : '';
    let digits = a.abs().toString();
    let exp10 = digits.length - 1 - P; // power of ten of the leading digit
    if (digits.length > n) {
        const rounded = big_integer_1.default(digits.slice(0, n)).add(digits[n] >= '5' ? 1 : 0).toString();
        if (rounded.length > n) {
            exp10++; // 9.99 rounded up to 10.0
        }
        digits = rounded.slice(0, n);
    }
    else {
        digits = digits.padEnd(n, '0');
    }
    if (exp10 < -6 || exp10 >= n) {
        const mantissa = digits[0] + '.' + (digits.slice(1) || '0');
        return `${sign}${mantissa}*10^${exp10 < 0 ? `(${exp10})` : exp10}`;
    }
    if (exp10 < 0) {
        return `${sign}0.${'0'.repeat(-exp10 - 1)}${digits}`;
    }
    const frac = digits.slice(exp10 + 1);
    return `${sign}${digits.slice(0, exp10 + 1)}.${frac || '0'}`;
}
// p, already evaluated exactly, to n significant digits
function bigFloat(p, n) {
    if (defs_1.istensor(p)) {
        const t = tensor_1.copy_tensor(p);
        t.tensor.elem = t.tensor.elem.map((el) => bigFloat(el, n));
        return t;
    }
    // Two runs at different precisions must print the same digits: that
    // catches lost digits from cancellation (sin(10^22), exp(100)-exp(100)+1/3)
    // and tiny results. The precision doubles until they agree.
    let P = n + GUARD;
    for (let attempt = 0;; attempt++) {
        let low;
        let high;
        const fine = new Fixed(P + GUARD);
        try {
            low = evaluate(p, new Fixed(P));
            high = evaluate(p, fine);
        }
        catch (e) {
            // a function without a method here says so
            const why = /^no arbitrary precision/.test(e.message) ? `: ${e.message}` : '';
            return run_1.stop(`float: cannot evaluate ${p} to ${n} digits${why}`);
        }
        const text = format(high, P + GUARD, n);
        const last = attempt === MAX_ATTEMPTS;
        // two zeros are no agreement, a tiny value underflows at both precisions;
        // only an exact zero is still zero at the last attempt
        const agree = format(low, P, n) === text && (!high.isZero() || last);
        if (agree) {
            const d = new defs_1.Double(fine.toNumber(high));
            d.bigRepr = text;
            return d;
        }
        if (last) {
            return run_1.stop(`float: the precision needed for ${n} digits is out of reach`);
        }
        P *= 2;
    }
}
exports.bigFloat = bigFloat;
// The sign of an exact real constant, for decisions (abs, sgn, the order of
// two bounds): two evaluations 25 digits apart must agree to 12 significant
// digits, at 30, then 60, then 120 digits. 1 or -1 when they do; 0 when p
// can be evaluated but not told from zero that way (an exact zero in
// disguise, sin(10^300)); undefined when there is no real evaluation here
// (unsupported function, a complex intermediate value: roots and logs of
// negative numbers throw).
// ponytail: agreement of two runs, no interval arithmetic. Wrong only if both
// runs are garbage and still agree to 12 digits.
function certifiedSign(p) {
    let result;
    for (const P of [30, 60, 120]) {
        let low;
        let high;
        try {
            low = evaluate(p, new Fixed(P, 1000));
            high = evaluate(p, new Fixed(P + GUARD, 1000));
        }
        catch (e) {
            continue; // may be the precision: 1-sin(10^40)^2 under a root
        }
        result = 0;
        const gap = low.multiply(big_integer_1.default(10).pow(GUARD)).subtract(high).abs();
        if (!high.isZero() && gap.multiply(1e12).lt(high.abs())) {
            return high.isNegative() ? -1 : 1;
        }
    }
    return result;
}
exports.certifiedSign = certifiedSign;
