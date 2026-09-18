"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fourier = exports.Eval_invfourier = exports.Eval_fourier = exports.Eval_fourierseries = exports.Eval_fouriercoeff = void 0;
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const assume_1 = require("./assume");
const bignum_1 = require("./bignum");
const denominator_1 = require("./denominator");
const derivative_1 = require("./derivative");
const eval_1 = require("./eval");
const expand_1 = require("./expand");
const factorial_1 = require("./factorial");
const float_1 = require("./float");
const imag_1 = require("./imag");
const is_1 = require("./is");
const laplace_1 = require("./laplace");
const list_1 = require("./list");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const power_1 = require("./power");
const numerator_1 = require("./numerator");
const rationalize_1 = require("./rationalize");
const real_1 = require("./real");
const scan_1 = require("./scan");
const simplify_1 = require("./simplify");
const subst_1 = require("./subst");
// Fourier series and Fourier transform.
//
//   fouriercoeff(f,x,k[,P])   [a_k, b_k]
//   fourierseries(f,x,n[,P])  a_0/2 + sum_{k=1..n} a_k cos(k pi x/L) + b_k sin(k pi x/L)
// with a_k = 1/L integral_a^b f cos(k pi x/L) dx, b_k the same with sin. The
// period P is [-pi,pi] when left out, a half period L for [-L,L], or an
// interval [a,b] with L = (b-a)/2.
//
//   fourier(f,x,w)    = integral_{-inf}^{inf} f(x) exp(-i w x) dx
//   invfourier(F,w,x) = 1/(2 pi) integral_{-inf}^{inf} F(w) exp(i w x) dw
// (no factor 1/sqrt(2 pi)). Table based like laplace; what no rule covers
// returns the call unevaluated.
const FOURIER = 'fourier';
const INVFOURIER = 'invfourier';
const call = (name, ...xs) => eval_1.Eval(list_1.makeList(symbol_1.symbol(name), ...xs));
const factors = (p) => (defs_1.ismultiply(p) ? p.tail() : [p]);
const terms = (p) => (defs_1.isadd(p) ? p.tail() : [p]);
const product = (ps) => ps.reduce(multiply_1.multiply, defs_1.Constants.one);
const sum = (ps) => ps.reduce(add_1.add, defs_1.Constants.zero);
const isexp = (p) => defs_1.car(p) === symbol_1.symbol(defs_1.POWER) && defs_1.cadr(p) === symbol_1.symbol(defs_1.E);
const isfn = (p, name) => defs_1.iscons(p) && defs_1.car(p) === symbol_1.symbol(name);
const pi = () => symbol_1.symbol(defs_1.PI);
const i = () => defs_1.Constants.imaginaryunit;
const minusInf = () => multiply_1.negate(symbol_1.symbol(defs_1.INF));
const isInf = (p) => p === symbol_1.symbol(defs_1.INF);
const isMinusInf = (p) => misc_1.equal(p, minusInf());
// 1, 0, -1, or undefined when neither the value nor the assumptions tell
function sign3(p) {
    const d = float_1.zzfloat(p);
    if (defs_1.isdouble(d)) {
        return Math.sign(d.d);
    }
    return assume_1.isPositive(p) ? 1 : assume_1.isNegative(p) ? -1 : is_1.isZeroAtomOrTensor(p) ? 0 : undefined;
}
// ------------------------------------------------- pieces between the kinks
// the arguments u of every abs(u) and sgn(u) that depends on x
function kinks(p, x, found = []) {
    if (defs_1.iscons(p)) {
        if ((isfn(p, defs_1.ABS) || isfn(p, defs_1.SGN)) && find_1.Find(defs_1.cadr(p), x) && !found.some((u) => misc_1.equal(u, defs_1.cadr(p)))) {
            found.push(defs_1.cadr(p));
        }
        for (let q = p; defs_1.iscons(q); q = defs_1.cdr(q)) {
            kinks(defs_1.car(q), x, found);
        }
    }
    return found;
}
// The zeros of u between a and b: of a linear u, or of sin/cos of a linear
// argument when everything is numeric. null: unknown.
function zeros(u, x, a, b) {
    const lin = laplace_1.linear(u, x);
    if (lin) {
        return [multiply_1.negate(multiply_1.divide(lin[1], lin[0]))];
    }
    if (!isfn(u, defs_1.SIN) && !isfn(u, defs_1.COS)) {
        return null;
    }
    const inner = laplace_1.linear(defs_1.cadr(u), x);
    if (!inner) {
        return null;
    }
    const [p, q] = inner;
    // p x + q = n pi + offset
    const offset = isfn(u, defs_1.SIN) ? defs_1.Constants.zero : multiply_1.divide(pi(), bignum_1.integer(2));
    const n = (at) => {
        const d = float_1.zzfloat(multiply_1.divide(add_1.subtract(add_1.add(multiply_1.multiply(p, at), q), offset), pi()));
        return defs_1.isdouble(d) ? d.d : NaN;
    };
    const [n1, n2] = [n(a), n(b)].sort((u, v) => u - v);
    if (!(n2 - n1 < 200)) {
        return null; // not numeric, or too many pieces
    }
    const result = [];
    for (let k = Math.ceil(n1); k <= Math.floor(n2); k++) {
        result.push(multiply_1.divide(add_1.subtract(add_1.add(multiply_1.multiply(bignum_1.integer(k), pi()), offset), q), p));
    }
    return result;
}
// f on [a,b] split at the kinks, with abs(u) and sgn(u) replaced by the
// sign of u on each piece. null when a position or a sign is unknown.
function pieces(f, x, a, b) {
    const us = kinks(f, x);
    const less = (p, q) => (isMinusInf(p) || isInf(q) ? 1 : sign3(add_1.subtract(q, p)));
    let points = [];
    for (const u of us) {
        const zs = zeros(u, x, a, b);
        if (zs === null) {
            return null;
        }
        for (const z of zs) {
            const [above, below] = [less(a, z), less(z, b)];
            if (above === undefined || below === undefined) {
                return null;
            }
            if (above === 1 && below === 1 && !points.some((p) => misc_1.equal(p, z))) {
                points.push(z);
            }
        }
    }
    if (points.length > 1) {
        // ponytail: several kinks are sorted by value, so they must be numbers
        const values = points.map((p) => float_1.zzfloat(p));
        if (!values.every(defs_1.isdouble)) {
            return null;
        }
        points = points
            .map((p, k) => [p, values[k].d])
            .sort((u, v) => u[1] - v[1])
            .map((u) => u[0]);
    }
    const bounds = [a, ...points, b];
    const result = [];
    for (let k = 0; k + 1 < bounds.length; k++) {
        const [lo, hi] = [bounds[k], bounds[k + 1]];
        const mid = isMinusInf(lo)
            ? isInf(hi)
                ? defs_1.Constants.zero
                : add_1.subtract(hi, defs_1.Constants.one)
            : isInf(hi)
                ? add_1.add(lo, defs_1.Constants.one)
                : multiply_1.divide(add_1.add(lo, hi), bignum_1.integer(2));
        let g = f;
        for (const u of us) {
            const s = sign3(eval_1.Eval(subst_1.subst(u, x, mid)));
            if (!s) {
                return null;
            }
            g = subst_1.subst(g, list_1.makeList(symbol_1.symbol(defs_1.ABS), u), multiply_1.multiply(bignum_1.integer(s), u));
            g = subst_1.subst(g, list_1.makeList(symbol_1.symbol(defs_1.SGN), u), bignum_1.integer(s));
        }
        result.push({ lo, hi, f: eval_1.Eval(g) });
    }
    return result;
}
// defint, or null. integral() has no rule for sin(x)*cos(2*x): those go
// through exponentials; a result that stays complex counts only on request.
function integrate(f, x, a, b, complex = false) {
    const attempt = (g) => {
        try {
            const r = call(defs_1.DEFINT, g, x, a, b);
            return find_1.Find(r, symbol_1.symbol(defs_1.INTEGRAL)) || find_1.Find(r, symbol_1.symbol(defs_1.DEFINT)) ? null : r;
        }
        catch (e) {
            return null;
        }
    };
    const direct = attempt(f);
    if (direct) {
        return direct;
    }
    const viaExp = attempt(call(defs_1.CIRCEXP, f));
    return viaExp && (complex || !find_1.Find(viaExp, i())) ? viaExp : null;
}
// ------------------------------------------------------------------ series
function period(P) {
    const [a, b] = P === symbol_1.symbol(defs_1.NIL)
        ? [multiply_1.negate(pi()), pi()]
        : defs_1.istensor(P) && P.tensor.nelem === 2
            ? [P.tensor.elem[0], P.tensor.elem[1]]
            : [multiply_1.negate(P), P];
    if (is_1.isZeroAtomOrTensor(add_1.subtract(b, a))) {
        run_1.stop('fourierseries: the period must not be zero');
    }
    return [a, b];
}
// [a_k, b_k], or null
function coefficients(f, x, k, a, b) {
    const L = multiply_1.divide(add_1.subtract(b, a), bignum_1.integer(2));
    const ps = pieces(f, x, a, b);
    if (ps === null) {
        return null;
    }
    const arg = multiply_1.divide(multiply_1.multiply(multiply_1.multiply(k, pi()), x), L);
    const coefficient = (name) => {
        let total = defs_1.Constants.zero;
        for (const p of ps) {
            const part = integrate(multiply_1.multiply(p.f, call(name, arg)), x, p.lo, p.hi);
            if (part === null) {
                return null;
            }
            total = add_1.add(total, part);
        }
        return multiply_1.divide(total, L);
    };
    const ak = coefficient(defs_1.COS);
    const bk = ak && coefficient(defs_1.SIN);
    return bk ? [ak, bk] : null;
}
function seriesArgs(p1) {
    return [eval_1.Eval(defs_1.cadr(p1)), eval_1.Eval(defs_1.caddr(p1)), eval_1.Eval(defs_1.cadddr(p1)), eval_1.Eval(defs_1.caddddr(p1))];
}
const unevaluated = (name, ...xs) => list_1.makeList(symbol_1.usr_symbol(name), ...xs.filter((p) => p !== symbol_1.symbol(defs_1.NIL)));
function Eval_fouriercoeff(p1) {
    return float_1.evalExactly(evalFouriercoeff, p1);
}
exports.Eval_fouriercoeff = Eval_fouriercoeff;
function evalFouriercoeff(p1) {
    const [f, x, k, P] = seriesArgs(p1);
    const c = coefficients(f, x, k, ...period(P));
    return c ? scan_1.build_tensor(c) : unevaluated('fouriercoeff', f, x, k, P);
}
function Eval_fourierseries(p1) {
    return float_1.evalExactly(evalFourierseries, p1);
}
exports.Eval_fourierseries = Eval_fourierseries;
function evalFourierseries(p1) {
    const [f, x, N, P] = seriesArgs(p1);
    const [a, b] = period(P);
    const n = bignum_1.nativeInt(N);
    if (!defs_1.isNumericAtom(N)) {
        return unevaluated('fourierseries', f, x, N, P);
    }
    if (isNaN(n) || n < 0 || n > 200) {
        run_1.stop('fourierseries: the number of terms must be an integer from 0 to 200');
    }
    const L = multiply_1.divide(add_1.subtract(b, a), bignum_1.integer(2));
    let series = defs_1.Constants.zero;
    for (let k = 0; k <= n; k++) {
        const c = coefficients(f, x, bignum_1.integer(k), a, b);
        if (c === null) {
            return unevaluated('fourierseries', f, x, N, P);
        }
        const arg = multiply_1.divide(multiply_1.multiply(multiply_1.multiply(bignum_1.integer(k), pi()), x), L);
        series = add_1.add(series, k === 0
            ? multiply_1.divide(c[0], bignum_1.integer(2))
            : add_1.add(multiply_1.multiply(c[0], call(defs_1.COS, arg)), multiply_1.multiply(c[1], call(defs_1.SIN, arg))));
    }
    return series;
}
// --------------------------------------------------------------- transform
function transformArgs(p1, x, y) {
    const a = eval_1.Eval(defs_1.caddr(p1));
    const b = eval_1.Eval(defs_1.cadddr(p1));
    return [eval_1.Eval(defs_1.cadr(p1)), a === symbol_1.symbol(defs_1.NIL) ? x : a, b === symbol_1.symbol(defs_1.NIL) ? y : b];
}
function Eval_fourier(p1) {
    return float_1.evalExactly((p) => {
        const [f, x, w] = transformArgs(p, symbol_1.symbol(defs_1.SYMBOL_X), symbol_1.usr_symbol('w'));
        const F = fourier(f, x, w);
        // two shifted poles give exp(i w) - exp(-i w): a sine
        return failed(F) ? F : toTrig(F, w, true);
    }, p1);
}
exports.Eval_fourier = Eval_fourier;
function Eval_invfourier(p1) {
    return float_1.evalExactly(evalInvfourier, p1);
}
exports.Eval_invfourier = Eval_invfourier;
function evalInvfourier(p1) {
    const [F, w, x] = transformArgs(p1, symbol_1.usr_symbol('w'), symbol_1.symbol(defs_1.SYMBOL_X));
    // f(x) = 1/(2 pi) * (the transform of F, taken at -x)
    const y = symbol_1.usr_symbol('$y'); // the parser can't produce it
    const G = fourier(F, w, y);
    if (failed(G)) {
        return list_1.makeList(symbol_1.usr_symbol(INVFOURIER), F, w, x);
    }
    let f = eval_1.Eval(subst_1.subst(G, y, multiply_1.negate(x)));
    // sgn(-x-1) = -sgn(x+1)
    for (const u of kinks(f, x)) {
        const lin = laplace_1.linear(u, x);
        if (lin && sign3(lin[0]) === -1) {
            f = subst_1.subst(f, list_1.makeList(symbol_1.symbol(defs_1.SGN), u), multiply_1.negate(list_1.makeList(symbol_1.symbol(defs_1.SGN), multiply_1.negate(u))));
        }
    }
    return multiply_1.divide(toTrig(eval_1.Eval(f), x, true), multiply_1.multiply(bignum_1.integer(2), pi()));
}
// exp(i c x) as cos(c x) + i sin(c x): the pair of impulses of a cosine comes
// back as two exponentials. realOnly: kept only when that makes the whole real.
function toTrig(p, x, realOnly) {
    // exp(i beta x + rest) with beta != 0: [beta, rest]
    const split = (q) => {
        if (!isexp(q)) {
            return null;
        }
        const beta = sum(terms(defs_1.caddr(q)).map((t) => {
            const lin = find_1.Find(t, x) ? laplace_1.linear(t, x) : null;
            return lin ? imag_1.imag(lin[0]) : defs_1.Constants.zero;
        }));
        return is_1.isZeroAtomOrTensor(beta) ? null : [beta, add_1.subtract(defs_1.caddr(q), multiply_1.multiply(multiply_1.multiply(i(), beta), x))];
    };
    const found = [];
    const collect = (q) => {
        if (split(q)) {
            found.push(q);
        }
        else if (defs_1.iscons(q)) {
            collect(defs_1.car(q));
            q.tail().forEach(collect);
        }
    };
    collect(p);
    if (!found.length) {
        return p;
    }
    let r = p;
    for (const g of found) {
        const [beta, rest] = split(g);
        const bx = multiply_1.multiply(beta, x);
        r = subst_1.subst(r, g, multiply_1.multiply(misc_1.exponential(rest), add_1.add(call(defs_1.COS, bx), multiply_1.multiply(i(), call(defs_1.SIN, bx)))));
    }
    r = eval_1.Eval(r);
    return realOnly && find_1.Find(r, i()) ? p : r;
}
const failed = (F) => find_1.Find(F, symbol_1.usr_symbol(FOURIER));
function fourier(f, x, w) {
    // abs, sgn and heaviside: piece by piece, the terms of
    // heaviside(x)*exp(-x) = exp(-x)/2 + sgn(x)*exp(-x)/2 have no transform
    // of their own
    const whole = kinks(f, x).length ? piecewise(f, x, w) : null;
    if (whole) {
        return whole;
    }
    const results = terms(f).map((t) => term(t, x, w));
    const bad = terms(f).filter((_, k) => failed(results[k]));
    if (bad.length > 1 && kinks(sum(bad), x).length) {
        const good = sum(results.filter((r) => !failed(r)));
        const group = piecewise(sum(bad), x, w);
        return add_1.add(good, group || list_1.makeList(symbol_1.usr_symbol(FOURIER), sum(bad), x, w));
    }
    return sum(results);
}
exports.fourier = fourier;
// One term: constants are pulled out. The result of a rule may hold an
// unevaluated fourier(...), as in i*d(fourier(f(x),x,w),w).
function term(t, x, w) {
    if (!find_1.Find(t, x)) {
        return multiply_1.multiply(multiply_1.multiply(multiply_1.multiply(bignum_1.integer(2), pi()), t), call(defs_1.DIRAC, w));
    }
    const c = product(factors(t).filter((g) => !find_1.Find(g, x)));
    const dep = factors(t).filter((g) => find_1.Find(g, x));
    const g = product(dep);
    let F = dep.length === 1 ? single(g, x, w) : null;
    if (F === null || failed(F)) {
        // a rational function: term by term over its partial fractions
        const parts = partialFractions(g, x);
        F = (parts && fourier(parts, x, w)) || F;
    }
    if (F === null || failed(F)) {
        F = productRule(dep, x, w) || F;
    }
    if ((F === null || failed(F)) && kinks(g, x).length) {
        F = piecewise(g, x, w) || F;
    }
    return multiply_1.multiply(c, F || list_1.makeList(symbol_1.usr_symbol(FOURIER), g, x, w));
}
// apart when it splits g, else null
function partialFractions(g, x) {
    try {
        const parts = expand_1.apart(g, x);
        return defs_1.isadd(parts) ? parts : null;
    }
    catch (e) {
        return null;
    }
}
// n for x or x^n (n a positive integer), else 0
function xPower(g, x) {
    if (g === x) {
        return 1;
    }
    if (defs_1.car(g) === symbol_1.symbol(defs_1.POWER) && defs_1.cadr(g) === x) {
        const n = bignum_1.nativeInt(defs_1.caddr(g));
        return n > 0 ? n : 0;
    }
    return 0;
}
// c for exp(i c x + d) with a real c, else null
function frequency(g, x) {
    const lin = isexp(g) ? laplace_1.linear(defs_1.caddr(g), x) : null;
    if (!lin) {
        return null;
    }
    const c = multiply_1.divide(lin[0], i());
    return assume_1.isReal(c) === true ? [c, lin[1]] : null;
}
function productRule(dep, x, w) {
    const others = (k) => product(dep.filter((_, j) => j !== k));
    const shifted = (G, by) => eval_1.Eval(subst_1.subst(G, w, add_1.add(w, by)));
    // exp(i c x + d) g(x) -> exp(d) G(w - c)
    const e = dep.findIndex((g) => frequency(g, x));
    if (e >= 0) {
        const [c, d] = frequency(dep[e], x);
        return multiply_1.multiply(misc_1.exponential(d), shifted(fourier(others(e), x, w), multiply_1.negate(c)));
    }
    // cos(c x + d) g(x) -> (exp(i d) G(w - c) + exp(-i d) G(w + c))/2,
    // sin(c x + d) g(x) -> (exp(i d) G(w - c) - exp(-i d) G(w + c))/(2 i)
    const t = dep.findIndex((g) => (isfn(g, defs_1.SIN) || isfn(g, defs_1.COS)) && laplace_1.linear(defs_1.cadr(g), x) && assume_1.isReal(laplace_1.linear(defs_1.cadr(g), x)[0]) === true);
    if (t >= 0) {
        const [c, d] = laplace_1.linear(defs_1.cadr(dep[t]), x);
        const G = fourier(others(t), x, w);
        const plus = multiply_1.multiply(misc_1.exponential(multiply_1.multiply(i(), d)), shifted(G, multiply_1.negate(c)));
        const minus = multiply_1.multiply(misc_1.exponential(multiply_1.negate(multiply_1.multiply(i(), d))), shifted(G, c));
        return isfn(dep[t], defs_1.COS)
            ? multiply_1.divide(add_1.add(plus, minus), bignum_1.integer(2))
            : multiply_1.divide(add_1.subtract(plus, minus), multiply_1.multiply(bignum_1.integer(2), i()));
    }
    // x^n g(x) -> i^n d^n/dw^n G(w)
    const p = dep.findIndex((g) => xPower(g, x) > 0);
    if (p >= 0) {
        const n = xPower(dep[p], x);
        let G = fourier(others(p), x, w);
        for (let k = 0; k < n; k++) {
            G = multiply_1.multiply(i(), derivative_1.derivative(G, w));
        }
        return G;
    }
    return null;
}
function single(g, x, w) {
    if (xPower(g, x) > 0 || frequency(g, x) || isfn(g, defs_1.SIN) || isfn(g, defs_1.COS)) {
        return productRule([g], x, w);
    }
    if (defs_1.car(g) === symbol_1.symbol(defs_1.DERIVATIVE) && defs_1.caddr(g) === x && defs_1.cadddr(g) === symbol_1.symbol(defs_1.NIL)) {
        // g' -> i w G(w)
        return multiply_1.multiply(multiply_1.multiply(i(), w), fourier(defs_1.cadr(g), x, w));
    }
    if (isexp(g)) {
        // exp(-A x^2 + B x + C), A > 0 -> sqrt(pi/A) exp(C + (B - i w)^2/(4 A)),
        // B may be complex: shift and modulation at once
        const d1 = derivative_1.derivative(defs_1.caddr(g), x);
        const d2 = derivative_1.derivative(d1, x);
        const A = multiply_1.divide(d2, bignum_1.integer(-2));
        if (find_1.Find(d2, x) || assume_1.isPositive(A) !== true) {
            return null;
        }
        const at0 = (p) => eval_1.Eval(subst_1.subst(p, x, defs_1.Constants.zero));
        const B = add_1.subtract(at0(d1), multiply_1.multiply(i(), w));
        return multiply_1.multiply(power_1.power(multiply_1.divide(pi(), A), bignum_1.rational(1, 2)), misc_1.exponential(add_1.add(at0(defs_1.caddr(g)), multiply_1.divide(multiply_1.multiply(B, B), multiply_1.multiply(bignum_1.integer(4), A)))));
    }
    if (defs_1.car(g) === symbol_1.symbol(defs_1.POWER) && bignum_1.nativeInt(defs_1.caddr(g)) < 0) {
        return reciprocal(defs_1.cadr(g), -bignum_1.nativeInt(defs_1.caddr(g)), x, w);
    }
    const lin = (isfn(g, defs_1.DIRAC) || isfn(g, defs_1.SGN)) && laplace_1.linear(defs_1.cadr(g), x);
    if (!lin || assume_1.isReal(lin[0]) !== true) {
        return null;
    }
    // g(a x + c) = g(a (x - x0)) -> exp(-i w x0) ...
    const [a, c] = lin;
    const shift = misc_1.exponential(multiply_1.divide(multiply_1.multiply(multiply_1.multiply(i(), w), c), a));
    if (isfn(g, defs_1.DIRAC)) {
        return multiply_1.divide(shift, call(defs_1.ABS, a));
    }
    // sgn(x) -> 2/(i w), sgn(a x) = sgn(a) sgn(x)
    const s = sign3(a);
    return s ? multiply_1.multiply(multiply_1.multiply(bignum_1.integer(s), shift), multiply_1.divide(bignum_1.integer(2), multiply_1.multiply(i(), w))) : null;
}
// 1/base^n with a polynomial base
function reciprocal(base, n, x, w) {
    const at0 = (p) => eval_1.Eval(subst_1.subst(p, x, defs_1.Constants.zero));
    const d1 = derivative_1.derivative(base, x);
    const d2 = derivative_1.derivative(d1, x);
    if (find_1.Find(d2, x)) {
        return null;
    }
    if (is_1.isZeroAtomOrTensor(d2)) {
        // 1/(x - x0) -> -i pi sgn(w) exp(-i w x0) for a real x0 (principal
        // value), 2 pi i exp(-i w x0) heaviside(-w) for x0 above the real axis,
        // -2 pi i exp(-i w x0) heaviside(w) below; the n-th power is the
        // (n-1)-th derivative: times (-i w)^(n-1)/(n-1)!
        const x0 = multiply_1.negate(multiply_1.divide(at0(base), d1));
        const side = sign3(imag_1.imag(x0));
        if (side === undefined || (side === 0 && assume_1.isReal(x0) !== true)) {
            return null;
        }
        const F = side === 0
            ? multiply_1.multiply(multiply_1.negate(multiply_1.multiply(i(), pi())), call(defs_1.SGN, w))
            : multiply_1.multiply(multiply_1.multiply(bignum_1.integer(2 * side), multiply_1.multiply(i(), pi())), call('heaviside', multiply_1.multiply(bignum_1.integer(-side), w)));
        return multiply_1.divide(multiply_1.multiply(multiply_1.multiply(F, misc_1.exponential(multiply_1.negate(multiply_1.multiply(multiply_1.multiply(i(), w), x0)))), power_1.power(multiply_1.negate(multiply_1.multiply(i(), w)), bignum_1.integer(n - 1))), multiply_1.multiply(factorial_1.factorial(bignum_1.integer(n - 1)), power_1.power(d1, bignum_1.integer(n))));
    }
    // b2 ((x - h)^2 + r^2) -> pi/(b2 r) exp(-r abs(w)) exp(-i w h), r^2 > 0
    const b2 = multiply_1.divide(d2, bignum_1.integer(2));
    const h = multiply_1.negate(multiply_1.divide(at0(d1), d2));
    const r2 = add_1.subtract(multiply_1.divide(at0(base), b2), multiply_1.multiply(h, h));
    if (n === 1 && assume_1.isPositive(r2) === true && assume_1.isReal(h) === true) {
        const r = power_1.power(r2, bignum_1.rational(1, 2));
        return multiply_1.multiply(multiply_1.divide(pi(), multiply_1.multiply(b2, r)), misc_1.exponential(add_1.subtract(multiply_1.negate(multiply_1.multiply(r, call(defs_1.ABS, w))), multiply_1.multiply(multiply_1.multiply(i(), w), h))));
    }
    // any other quadratic b2 (x - r1)(x - r2), also with complex coefficients:
    // 1/((x - r1)(x - r2)) = (1/(x - r1) - 1/(x - r2))/(r1 - r2)
    if (n !== 1) {
        return null;
    }
    const pole = (r, order) => reciprocal(add_1.subtract(x, r), order, x, w);
    const q = power_1.power(multiply_1.negate(r2), bignum_1.rational(1, 2));
    if (is_1.isZeroAtomOrTensor(q)) {
        const F = pole(h, 2);
        return F && multiply_1.divide(F, b2);
    }
    const [F1, F2] = [pole(add_1.add(h, q), 1), pole(add_1.subtract(h, q), 1)];
    return F1 && F2 && multiply_1.divide(add_1.subtract(F1, F2), multiply_1.multiply(multiply_1.multiply(bignum_1.integer(2), q), b2));
}
// exponential decay for t -> inf: every term has a factor exp(B t + C) with
// Re B < 0 next to powers of t and sin/cos of real linear arguments
function decays(f, t) {
    return terms(f).every((g) => {
        const dep = factors(g).filter((h) => find_1.Find(h, t));
        const damped = dep.some((h) => {
            const lin = isexp(h) ? laplace_1.linear(defs_1.caddr(h), t) : null;
            return lin !== null && assume_1.isNegative(real_1.real(lin[0])) === true;
        });
        return (damped &&
            dep.every((h) => {
                const lin = isexp(h) || isfn(h, defs_1.SIN) || isfn(h, defs_1.COS) ? laplace_1.linear(isexp(h) ? defs_1.caddr(h) : defs_1.cadr(h), t) : null;
                return xPower(h, t) > 0 || (lin !== null && (isexp(h) || assume_1.isReal(lin[0]) === true));
            }));
    });
}
// The integral piece by piece between the kinks of abs and sgn: defint on a
// finite piece, the laplace transform at s = +-i w on a decaying infinite one.
function piecewise(f, x, w) {
    const ps = pieces(f, x, minusInf(), symbol_1.symbol(defs_1.INF));
    if (ps === null) {
        return null;
    }
    const s = symbol_1.usr_symbol('$s');
    const iw = multiply_1.multiply(i(), w);
    let total = defs_1.Constants.zero;
    // the infinite pieces as numerator/denominator: 1/(1+i w) + 1/(1-i w)
    // only becomes 2/(1+w^2) over the common denominator
    const tails = [];
    let direct = defs_1.Constants.zero; // a single one keeps the form of the laplace table
    for (const p of ps) {
        if (is_1.isZeroAtomOrTensor(p.f)) {
            continue;
        }
        if (isMinusInf(p.lo) || isInf(p.hi)) {
            if (isMinusInf(p.lo) && isInf(p.hi)) {
                return null;
            }
            // x = lo + t, or x = hi - t: exp(-i w lo) L(i w), exp(-i w hi) L(-i w)
            const up = isInf(p.hi);
            const from = up ? p.lo : p.hi;
            const g = eval_1.Eval(subst_1.subst(p.f, x, up ? add_1.add(from, x) : add_1.subtract(from, x)));
            if (!decays(g, x)) {
                return null;
            }
            const L = laplace_1.laplace(g, x, s);
            if (find_1.Find(L, symbol_1.symbol(defs_1.LAPLACE))) {
                return null;
            }
            const G = rationalize_1.rationalize(L);
            const at = (q) => eval_1.Eval(subst_1.subst(q, s, up ? iw : multiply_1.negate(iw)));
            direct = multiply_1.multiply(misc_1.exponential(multiply_1.negate(multiply_1.multiply(iw, from))), at(L));
            tails.push([multiply_1.multiply(misc_1.exponential(multiply_1.negate(multiply_1.multiply(iw, from))), at(numerator_1.numerator(G))), at(denominator_1.denominator(G))]);
            continue;
        }
        const re = integrate(multiply_1.multiply(p.f, call(defs_1.COS, multiply_1.multiply(w, x))), x, p.lo, p.hi);
        const im = re && integrate(multiply_1.multiply(p.f, call(defs_1.SIN, multiply_1.multiply(w, x))), x, p.lo, p.hi);
        const part = im
            ? add_1.subtract(re, multiply_1.multiply(i(), im))
            : integrate(multiply_1.multiply(p.f, misc_1.exponential(multiply_1.negate(multiply_1.multiply(iw, x)))), x, p.lo, p.hi, true);
        if (part === null) {
            return null;
        }
        total = add_1.add(total, im ? part : toTrig(part, w, false));
    }
    if (tails.length === 2) {
        const [[n1, d1], [n2, d2]] = tails;
        return add_1.add(total, simplify_1.simplify(multiply_1.divide(add_1.add(multiply_1.multiply(n1, d2), multiply_1.multiply(n2, d1)), multiply_1.multiply(d1, d2))));
    }
    return add_1.add(total, direct);
}
