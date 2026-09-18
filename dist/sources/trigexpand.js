"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trigexpand = exports.Eval_trigexpand = void 0;
const defs_1 = require("../runtime/defs");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const cos_1 = require("./cos");
const eval_1 = require("./eval");
const is_1 = require("./is");
const multiply_1 = require("./multiply");
const sin_1 = require("./sin");
const tensor_1 = require("./tensor");
// trigexpand(x): expands sin/cos/tan of sums and integer multiples,
// e.g. sin(2x) -> 2 sin(x) cos(x), cos(x+y) -> cos(x) cos(y) - sin(x) sin(y).
function Eval_trigexpand(p1) {
    return trigexpand(eval_1.Eval(defs_1.cadr(p1)));
}
exports.Eval_trigexpand = Eval_trigexpand;
function trigexpand(p) {
    if (defs_1.istensor(p)) {
        const t = tensor_1.copy_tensor(p);
        t.tensor.elem = t.tensor.elem.map(trigexpand);
        return t;
    }
    if (!defs_1.iscons(p)) {
        return p;
    }
    const f = defs_1.car(p);
    if (f === symbol_1.symbol(defs_1.SIN) || f === symbol_1.symbol(defs_1.COS) || f === symbol_1.symbol(defs_1.TAN)) {
        const [s, c] = sincos(trigexpand(defs_1.cadr(p)));
        return f === symbol_1.symbol(defs_1.SIN) ? s : f === symbol_1.symbol(defs_1.COS) ? c : multiply_1.divide(s, c);
    }
    return eval_1.Eval(p.map(trigexpand));
}
exports.trigexpand = trigexpand;
// [sin(u), cos(u)], each expanded.
function sincos(u) {
    let a, b;
    if (defs_1.isadd(u)) {
        // u = a + b, b being all remaining terms
        a = defs_1.cadr(u);
        b = add_1.subtract(u, a);
    }
    else {
        const n = integerFactor(u);
        if (!(n >= 2)) {
            return [sin_1.sine(u), cos_1.cosine(u)];
        }
        // u = x + (n-1) x
        a = multiply_1.divide(u, bignum_1.integer(n));
        b = add_1.subtract(u, a);
    }
    const [sa, ca] = sincos(a);
    const [sb, cb] = sincos(b);
    return [
        add_1.add(multiply_1.multiply(sa, cb), multiply_1.multiply(ca, sb)),
        add_1.subtract(multiply_1.multiply(ca, cb), multiply_1.multiply(sa, sb)),
    ];
}
// n of n*x for a small integer n (negative n are handled by sin/cos
// themselves, which pull the sign out), otherwise NaN.
// ponytail: n capped at 50 (~0.1 s, ~800 chars), since simplify runs this
// on every trig expression; the output grows linearly, the time faster.
function integerFactor(u) {
    if (defs_1.ismultiply(u) && is_1.isinteger(defs_1.cadr(u))) {
        const n = bignum_1.nativeInt(defs_1.cadr(u));
        return n <= 50 ? n : NaN;
    }
    return NaN;
}
