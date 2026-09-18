"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logarithm = exports.Eval_log = void 0;
const defs_1 = require("../runtime/defs");
const symbol_1 = require("../runtime/symbol");
const abs_1 = require("./abs");
const add_1 = require("./add");
const arg_1 = require("./arg");
const bignum_1 = require("./bignum");
const denominator_1 = require("./denominator");
const eval_1 = require("./eval");
const is_1 = require("./is");
const list_1 = require("./list");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const numerator_1 = require("./numerator");
const power_1 = require("./power");
const quantity_1 = require("./quantity");
// Natural logarithm.
//
// Note that we use the mathematics / Javascript / Mathematica
// convention that "log" is indeed the natural logarithm.
//
// In engineering, biology, astronomy, "log" can stand instead
// for the "common" logarithm i.e. base 10. Also note that Google
// calculations use log for the common logarithm.
// log(x) is the natural logarithm; log(x, base) = log(x)/log(base).
function Eval_log(p1) {
    const x = quantity_1.requireDimensionless(eval_1.Eval(defs_1.cadr(p1)), 'log');
    if (!defs_1.iscons(defs_1.cddr(p1))) {
        return logarithm(x);
    }
    const base = quantity_1.requireDimensionless(eval_1.Eval(defs_1.caddr(p1)), 'log');
    return exactLog(x, base) || multiply_1.divide(logarithm(x), logarithm(base));
}
exports.Eval_log = Eval_log;
// The integer n with base^n = x, for rational x and base: the exponent is
// guessed in floating point and then verified exactly.
function exactLog(x, base) {
    if (!defs_1.isrational(x) || !defs_1.isrational(base)) {
        return undefined;
    }
    const n = Math.round(Math.log(bignum_1.nativeDouble(x)) / Math.log(bignum_1.nativeDouble(base)));
    if (Number.isFinite(n) && misc_1.equal(power_1.power(base, bignum_1.integer(n)), x)) {
        return bignum_1.integer(n);
    }
    return undefined;
}
function logarithm(p1) {
    if (p1 === symbol_1.symbol(defs_1.E)) {
        return defs_1.Constants.one;
    }
    if (is_1.equaln(p1, 1)) {
        return defs_1.Constants.zero;
    }
    if (is_1.isnegativenumber(p1)) {
        return add_1.add(logarithm(multiply_1.negate(p1)), multiply_1.multiply(defs_1.Constants.imaginaryunit, defs_1.Constants.Pi()));
    }
    if (defs_1.isdouble(p1)) {
        return bignum_1.double(Math.log(p1.d));
    }
    // principal branch: log(z) = log(|z|) + i arg(z), with -pi < arg(z) <= pi
    // (splitting -i as log(-1) + log(i) would give 3/2 i pi)
    if (is_1.iscomplexnumber(p1)) {
        return add_1.add(logarithm(abs_1.absval(p1)), multiply_1.multiply(defs_1.Constants.imaginaryunit, arg_1.arg(p1)));
    }
    // rational number and not an integer?
    if (is_1.isfraction(p1)) {
        return add_1.subtract(logarithm(numerator_1.numerator(p1)), logarithm(denominator_1.denominator(p1)));
    }
    // log(a ^ b) --> b log(a)
    if (defs_1.ispower(p1)) {
        return multiply_1.multiply(defs_1.caddr(p1), logarithm(defs_1.cadr(p1)));
    }
    // log(a * b) --> log(a) + log(b)
    if (defs_1.ismultiply(p1)) {
        return p1.tail().map(logarithm).reduce(add_1.add, defs_1.Constants.zero);
    }
    return list_1.makeList(symbol_1.symbol(defs_1.LOG), p1);
}
exports.logarithm = logarithm;
