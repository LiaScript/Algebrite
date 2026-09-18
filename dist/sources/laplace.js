"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_invlaplace = exports.Eval_laplace = void 0;
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const derivative_1 = require("./derivative");
const eval_1 = require("./eval");
const expand_1 = require("./expand");
const factorial_1 = require("./factorial");
const is_1 = require("./is");
const list_1 = require("./list");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const power_1 = require("./power");
const subst_1 = require("./subst");
const test_1 = require("./test");
// laplace(f, t, s) and invlaplace(F, s, t), table based.
// Rules not covered return the call unevaluated, like unknown functions.
function Eval_laplace(p1) {
    misc_1.checkArgCount(p1, 1, 3);
    const [f, t, s] = args(p1, defs_1.SYMBOL_T, defs_1.SYMBOL_S);
    return laplace(f, t, s);
}
exports.Eval_laplace = Eval_laplace;
function Eval_invlaplace(p1) {
    misc_1.checkArgCount(p1, 1, 3);
    const [F, s, t] = args(p1, defs_1.SYMBOL_S, defs_1.SYMBOL_T);
    return invlaplace(F, s, t);
}
exports.Eval_invlaplace = Eval_invlaplace;
function args(p1, x, y) {
    const a = eval_1.Eval(defs_1.caddr(p1));
    const b = eval_1.Eval(defs_1.cadddr(p1));
    return [
        eval_1.Eval(defs_1.cadr(p1)),
        a === symbol_1.symbol(defs_1.NIL) ? symbol_1.symbol(x) : a,
        b === symbol_1.symbol(defs_1.NIL) ? symbol_1.symbol(y) : b,
    ];
}
const call = (name, ...xs) => eval_1.Eval(list_1.makeList(symbol_1.symbol(name), ...xs));
const factors = (p) => (defs_1.ismultiply(p) ? p.tail() : [p]);
const product = (ps) => ps.reduce(multiply_1.multiply, defs_1.Constants.one);
const isexp = (p) => defs_1.car(p) === symbol_1.symbol(defs_1.POWER) && defs_1.cadr(p) === symbol_1.symbol(defs_1.E);
// u = a*x + c with a, c free of x, else null
function linear(u, x) {
    const a = derivative_1.derivative(u, x);
    if (find_1.Find(a, x)) {
        return null;
    }
    return [a, eval_1.Eval(subst_1.subst(u, x, defs_1.Constants.zero))];
}
// ---------------------------------------------------------------- laplace
function laplace(f, t, s) {
    const unevaluated = list_1.makeList(symbol_1.symbol(defs_1.LAPLACE), f, t, s);
    if (!find_1.Find(f, t)) {
        return multiply_1.divide(f, s);
    }
    if (defs_1.isadd(f)) {
        return f.tail().reduce((acc, g) => add_1.add(acc, laplace(g, t, s)), defs_1.Constants.zero);
    }
    const constant = factors(f).filter((g) => !find_1.Find(g, t));
    const dep = factors(f).filter((g) => find_1.Find(g, t));
    const c = product(constant);
    const result = dep.length === 1 ? single(dep[0], t, s) : productRule(dep, t, s);
    return result === null
        ? is_1.isplusone(c)
            ? unevaluated
            : multiply_1.multiply(c, list_1.makeList(symbol_1.symbol(defs_1.LAPLACE), product(dep), t, s))
        : multiply_1.multiply(c, result);
}
// Products of t-dependent factors: shift theorem and multiplication by t^n.
function productRule(dep, t, s) {
    const e = dep.findIndex((g) => isexp(g) && linear(defs_1.caddr(g), t));
    if (e >= 0) {
        // L{exp(a t + c) g(t)} = exp(c) G(s - a)
        const [a, c] = linear(defs_1.caddr(dep[e]), t);
        const rest = product(dep.filter((_, i) => i !== e));
        const G = laplace(rest, t, s);
        return multiply_1.multiply(misc_1.exponential(c), eval_1.Eval(subst_1.subst(G, s, add_1.subtract(s, a))));
    }
    const p = dep.findIndex((g) => tPower(g, t) > 0);
    if (p >= 0) {
        // L{t^n g(t)} = (-1)^n d^n/ds^n G(s)
        const n = tPower(dep[p], t);
        let G = laplace(product(dep.filter((_, i) => i !== p)), t, s);
        for (let i = 0; i < n; i++) {
            G = multiply_1.negate(derivative_1.derivative(G, s));
        }
        return G;
    }
    return null;
}
// n for t or t^n (n a positive integer), else 0
function tPower(g, t) {
    if (g === t) {
        return 1;
    }
    if (defs_1.car(g) === symbol_1.symbol(defs_1.POWER) && defs_1.cadr(g) === t) {
        const n = bignum_1.nativeInt(defs_1.caddr(g));
        return n > 0 ? n : 0;
    }
    return 0;
}
function single(g, t, s) {
    const n = tPower(g, t);
    if (n > 0) {
        return multiply_1.divide(factorial_1.factorial(bignum_1.integer(n)), power_1.power(s, bignum_1.integer(n + 1)));
    }
    if (defs_1.car(g) === symbol_1.symbol(defs_1.DERIVATIVE) && defs_1.caddr(g) === t && defs_1.cadddr(g) === symbol_1.symbol(defs_1.NIL)) {
        // L{g'} = s G(s) - g(0)
        const inner = defs_1.cadr(g);
        return add_1.subtract(multiply_1.multiply(s, laplace(inner, t, s)), initialValue(inner, t));
    }
    const arg = isexp(g) ? defs_1.caddr(g) : defs_1.cadr(g);
    const lin = linear(arg, t);
    if (lin === null) {
        return null;
    }
    let [a, c] = lin;
    const f = defs_1.car(g);
    if (f === symbol_1.symbol(defs_1.DIRAC) && test_1.cmp_values(a, defs_1.Constants.zero) === -1) {
        // dirac is even: dirac(-t + 3) = dirac(t - 3)
        [a, c] = [multiply_1.negate(a), multiply_1.negate(c)];
    }
    if (isexp(g)) {
        return multiply_1.divide(misc_1.exponential(c), add_1.subtract(s, a));
    }
    // sin/cos(a t + c) = sin/cos(a t) cos(c) +/- cos/sin(a t) sin(c)
    const trig = (sq, x, y) => multiply_1.divide(add_1.add(multiply_1.multiply(a, x), multiply_1.multiply(s, y)), sq);
    const circ = add_1.add(power_1.power(s, bignum_1.integer(2)), power_1.power(a, bignum_1.integer(2)));
    const hyp = add_1.subtract(power_1.power(s, bignum_1.integer(2)), power_1.power(a, bignum_1.integer(2)));
    if (f === symbol_1.symbol(defs_1.SIN)) {
        return trig(circ, call(defs_1.COS, c), call(defs_1.SIN, c));
    }
    if (f === symbol_1.symbol(defs_1.COS)) {
        return trig(circ, multiply_1.negate(call(defs_1.SIN, c)), call(defs_1.COS, c));
    }
    if (f === symbol_1.symbol(defs_1.SINH)) {
        return trig(hyp, call(defs_1.COSH, c), call(defs_1.SINH, c));
    }
    if (f === symbol_1.symbol(defs_1.COSH)) {
        return trig(hyp, call(defs_1.SINH, c), call(defs_1.COSH, c));
    }
    // sgn(a t + c) = sgn(t - t0) for a > 0, t0 = -c/a >= 0:
    // L = (2 exp(-t0 s) - 1)/s, so heaviside(t - t0) -> exp(-t0 s)/s
    // dirac(a t + c) = dirac(t - t0)/a -> exp(-t0 s)/a
    if (f === symbol_1.symbol(defs_1.SGN) || f === symbol_1.symbol(defs_1.DIRAC)) {
        const t0 = multiply_1.negate(multiply_1.divide(c, a));
        if (test_1.cmp_values(a, defs_1.Constants.zero) !== 1 || test_1.cmp_values(t0, defs_1.Constants.zero) === -1) {
            return null;
        }
        const shift = misc_1.exponential(multiply_1.negate(multiply_1.multiply(t0, s)));
        return f === symbol_1.symbol(defs_1.SGN)
            ? multiply_1.divide(add_1.subtract(multiply_1.multiply(bignum_1.integer(2), shift), defs_1.Constants.one), s)
            : multiply_1.divide(shift, a);
    }
    return null;
}
// g(0); a derivative becomes y'(0)
function initialValue(g, t) {
    return eval_1.Eval(subst_1.subst(g, t, defs_1.Constants.zero));
}
// ------------------------------------------------------------- invlaplace
function invlaplace(F, s, t) {
    if (!find_1.Find(F, s)) {
        return multiply_1.multiply(F, call(defs_1.DIRAC, t));
    }
    if (defs_1.isadd(F)) {
        return F.tail().reduce((acc, G) => add_1.add(acc, invlaplace(G, s, t)), defs_1.Constants.zero);
    }
    // exp(-t0 s + c) G(s) -> exp(c) heaviside(t - t0) g(t - t0), t0 >= 0;
    // an impulse in g is only delayed, dirac(t - t0) needs no heaviside
    const fs = factors(F);
    const e = fs.findIndex((g) => isexp(g) && linear(defs_1.caddr(g), s));
    if (e >= 0) {
        const [a, c] = linear(defs_1.caddr(fs[e]), s);
        const t0 = multiply_1.negate(a);
        const g = invlaplace(product(fs.filter((_, i) => i !== e)), s, t);
        if (find_1.Find(g, symbol_1.symbol(defs_1.INVLAPLACE)) || test_1.cmp_values(t0, defs_1.Constants.zero) === -1) {
            return list_1.makeList(symbol_1.symbol(defs_1.INVLAPLACE), F, s, t);
        }
        const step = call('heaviside', add_1.subtract(t, t0));
        const shifted = eval_1.Eval(subst_1.subst(g, t, add_1.subtract(t, t0)));
        const terms = defs_1.isadd(shifted) ? shifted.tail() : [shifted];
        return multiply_1.multiply(misc_1.exponential(c), terms.reduce((acc, g) => add_1.add(acc, find_1.Find(g, symbol_1.symbol(defs_1.DIRAC)) ? g : multiply_1.multiply(step, g)), defs_1.Constants.zero));
    }
    const parts = expand_1.apart(F, s);
    const terms = defs_1.isadd(parts) ? parts.tail() : [parts];
    return terms.reduce((acc, G) => add_1.add(acc, invterm(G, s, t)), defs_1.Constants.zero);
}
// One partial fraction: c/(b1 s + b0)^n or (alpha s + beta)/(b2 s^2 + b1 s + b0).
function invterm(G, s, t) {
    if (!find_1.Find(G, s)) {
        return invlaplace(G, s, t);
    }
    const unevaluated = list_1.makeList(symbol_1.symbol(defs_1.INVLAPLACE), G, s, t);
    // the s-dependent factor with a negative integer exponent is the
    // denominator base^n; power() is avoided, it would expand (s+1)^3
    const isden = (g) => defs_1.car(g) === symbol_1.symbol(defs_1.POWER) && bignum_1.nativeInt(defs_1.caddr(g)) < 0 && find_1.Find(g, s);
    const dens = factors(G).filter(isden);
    const N = product(factors(G).filter((g) => !isden(g)));
    if (dens.length !== 1) {
        return unevaluated;
    }
    const base = defs_1.cadr(dens[0]);
    const n = -bignum_1.nativeInt(defs_1.caddr(dens[0]));
    const zero = defs_1.Constants.zero;
    const d1 = derivative_1.derivative(base, s);
    const d2 = derivative_1.derivative(d1, s);
    const lin = linear(N, s);
    if (lin === null || find_1.Find(d2, s)) {
        return unevaluated;
    }
    const [alpha, beta] = lin;
    if (is_1.isZeroAtomOrTensor(d2)) {
        // c/(s - a)^n -> c t^(n-1) exp(a t)/(n-1)!
        if (!is_1.isZeroAtomOrTensor(alpha)) {
            return unevaluated;
        }
        const a = multiply_1.negate(multiply_1.divide(eval_1.Eval(subst_1.subst(base, s, zero)), d1));
        const c = multiply_1.divide(beta, power_1.power(d1, bignum_1.integer(n)));
        return multiply_1.divide(multiply_1.multiply(multiply_1.multiply(c, power_1.power(t, bignum_1.integer(n - 1))), misc_1.exponential(multiply_1.multiply(a, t))), factorial_1.factorial(bignum_1.integer(n - 1)));
    }
    // (alpha s + beta)/(b2 s^2 + b1 s + b0)^n, and
    // s^2 + b1/b2 s + b0/b2 = (s - h)^2 + w2, so with u = s - h this is
    // (A u + B)/(u^2 + w2)^n, shifted by exp(h t)
    const b2 = multiply_1.divide(d2, bignum_1.integer(2));
    const b1 = eval_1.Eval(subst_1.subst(d1, s, zero));
    const b0 = eval_1.Eval(subst_1.subst(base, s, zero));
    const h = multiply_1.negate(multiply_1.divide(b1, d2));
    const w2 = add_1.subtract(multiply_1.divide(b0, b2), multiply_1.multiply(h, h));
    const bn = power_1.power(b2, bignum_1.integer(n));
    const A = multiply_1.divide(alpha, bn);
    const B = multiply_1.divide(add_1.add(beta, multiply_1.multiply(alpha, h)), bn);
    const eht = misc_1.exponential(multiply_1.multiply(h, t));
    const sign = test_1.cmp_values(w2, zero);
    if (sign === 0) {
        // (s - h)^2n: apart gives linear factors, so only n = 1 gets here
        return n === 1 ? multiply_1.multiply(eht, add_1.add(A, multiply_1.multiply(B, t))) : unevaluated;
    }
    const hyperbolic = sign === -1;
    const [p, q] = quadratic(n, hyperbolic ? multiply_1.negate(w2) : w2, hyperbolic, t);
    return multiply_1.multiply(eht, add_1.add(multiply_1.multiply(A, p), multiply_1.multiply(B, q)));
}
// Inverses of u/(u^2 + c)^n and 1/(u^2 + c)^n (u^2 - c when hyperbolic).
// n = 1 is the table; since d/dc (u^2 + c)^-n = -n (u^2 + c)^-(n+1),
// each further power is -1/n (+1/n when hyperbolic) times the c-derivative.
function quadratic(n, c, hyperbolic, t) {
    const k = symbol_1.usr_symbol('$c'); // placeholder for c, the parser can't produce it
    const r = power_1.power(k, bignum_1.rational(1, 2));
    let p = call(hyperbolic ? defs_1.COSH : defs_1.COS, multiply_1.multiply(r, t));
    let q = multiply_1.divide(call(hyperbolic ? defs_1.SINH : defs_1.SIN, multiply_1.multiply(r, t)), r);
    for (let i = 1; i < n; i++) {
        const f = bignum_1.rational(hyperbolic ? 1 : -1, i);
        p = multiply_1.multiply(f, derivative_1.derivative(p, k));
        q = multiply_1.multiply(f, derivative_1.derivative(q, k));
    }
    return [eval_1.Eval(subst_1.subst(p, k, c)), eval_1.Eval(subst_1.subst(q, k, c))];
}
