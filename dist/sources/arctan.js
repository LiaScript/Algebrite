"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arctan = exports.Eval_arctan = void 0;
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const symbol_1 = require("../runtime/symbol");
const misc_1 = require("../sources/misc");
const bignum_1 = require("./bignum");
const denominator_1 = require("./denominator");
const eval_1 = require("./eval");
const is_1 = require("./is");
const add_1 = require("./add");
const power_1 = require("./power");
const list_1 = require("./list");
const multiply_1 = require("./multiply");
const numerator_1 = require("./numerator");
const quantity_1 = require("./quantity");
/* arctan =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------
Returns the inverse tangent of x.

*/
function Eval_arctan(x) {
    return arctan(quantity_1.requireDimensionless(eval_1.Eval(defs_1.cadr(x)), 'arctan'));
}
exports.Eval_arctan = Eval_arctan;
function arctan(x) {
    if (defs_1.car(x) === symbol_1.symbol(defs_1.TAN)) {
        return arctanOfTan(defs_1.cadr(x)) || list_1.makeList(symbol_1.symbol(defs_1.ARCTAN), x);
    }
    if (defs_1.isdouble(x)) {
        return bignum_1.double(Math.atan(x.d));
    }
    if (is_1.isZeroAtomOrTensor(x)) {
        return defs_1.Constants.zero;
    }
    if (is_1.isnegative(x)) {
        return multiply_1.negate(arctan(multiply_1.negate(x)));
    }
    // arctan(sin(a) / cos(a)) ?
    if (find_1.Find(x, symbol_1.symbol(defs_1.SIN)) && find_1.Find(x, symbol_1.symbol(defs_1.COS))) {
        const p2 = numerator_1.numerator(x);
        const p3 = denominator_1.denominator(x);
        if (defs_1.car(p2) === symbol_1.symbol(defs_1.SIN) &&
            defs_1.car(p3) === symbol_1.symbol(defs_1.COS) &&
            misc_1.equal(defs_1.cadr(p2), defs_1.cadr(p3))) {
            return arctanOfTan(defs_1.cadr(p2)) || list_1.makeList(symbol_1.symbol(defs_1.ARCTAN), x);
        }
    }
    // arctan(1/sqrt(3)) -> pi/6
    // second if catches the other way of saying it, sqrt(3)/3
    if ((defs_1.ispower(x) && is_1.equaln(defs_1.cadr(x), 3) && is_1.equalq(defs_1.caddr(x), -1, 2)) ||
        (defs_1.ismultiply(x) &&
            is_1.equalq(defs_1.car(defs_1.cdr(x)), 1, 3) &&
            defs_1.car(defs_1.car(defs_1.cdr(defs_1.cdr(x)))) === symbol_1.symbol(defs_1.POWER) &&
            is_1.equaln(defs_1.car(defs_1.cdr(defs_1.car(defs_1.cdr(defs_1.cdr(x))))), 3) &&
            is_1.equalq(defs_1.car(defs_1.cdr(defs_1.cdr(defs_1.car(defs_1.cdr(defs_1.cdr(x)))))), 1, 2))) {
        return multiply_1.multiply(bignum_1.rational(1, 6), defs_1.Constants.Pi());
    }
    // arctan(1) -> pi/4
    if (is_1.equaln(x, 1)) {
        return multiply_1.multiply(bignum_1.rational(1, 4), defs_1.Constants.Pi());
    }
    // arctan(sqrt(3)) -> pi/3
    if (defs_1.ispower(x) && is_1.equaln(defs_1.cadr(x), 3) && is_1.equalq(defs_1.caddr(x), 1, 2)) {
        return multiply_1.multiply(bignum_1.rational(1, 3), defs_1.Constants.Pi());
    }
    // arctan(2-sqrt(3)) -> pi/12, arctan(2+sqrt(3)) -> 5*pi/12
    const sqrt3 = power_1.power(bignum_1.integer(3), bignum_1.rational(1, 2));
    for (const [value, twelfths] of [
        [add_1.subtract(bignum_1.integer(2), sqrt3), 1],
        [add_1.add(bignum_1.integer(2), sqrt3), 5]
    ]) {
        if (misc_1.equal(x, value)) {
            return multiply_1.multiply(bignum_1.rational(twelfths, 12), defs_1.Constants.Pi());
        }
        if (misc_1.equal(x, multiply_1.negate(value))) {
            return multiply_1.multiply(bignum_1.rational(-twelfths, 12), defs_1.Constants.Pi());
        }
    }
    return list_1.makeList(symbol_1.symbol(defs_1.ARCTAN), x);
}
exports.arctan = arctan;
// arctan(tan(u)) = u - k pi, which lies in [-pi/2, pi/2]; only decidable
// when u is a real constant (arctan(tan(x)) is not x), else null
function arctanOfTan(u) {
    const k = Math.round(is_1.realconstant(u) / Math.PI);
    return isNaN(k) ? null : add_1.subtract(u, multiply_1.multiply(bignum_1.integer(k), defs_1.Constants.Pi()));
}
