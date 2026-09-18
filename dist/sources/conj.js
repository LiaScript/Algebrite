"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conjugate = exports.conj = exports.Eval_conj = void 0;
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const clock_1 = require("./clock");
const eval_1 = require("./eval");
const is_1 = require("./is");
const multiply_1 = require("./multiply");
const polar_1 = require("./polar");
const subst_1 = require("./subst");
const quantity_1 = require("./quantity");
/* conj =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
z

General description
-------------------
Returns the complex conjugate of z.

*/
function Eval_conj(p1) {
    return conj(eval_1.Eval(defs_1.cadr(p1)));
}
exports.Eval_conj = Eval_conj;
// conjugate of an evaluated expression
function conj(p1) {
    // Symbols are real, so only powers of -1 (i is (-1)^(1/2)) are complex.
    // Without any, the value is real: going through polar would lose the
    // sign, since arg() assumes symbols positive (conj(a-b) gave abs(a-b)).
    if (!hasPowerOfMinusOne(p1)) {
        return p1;
    }
    if (!find_1.Find(p1, defs_1.Constants.imaginaryunit)) {
        // example: (-1)^(1/3)
        return clock_1.clockform(conjugate(polar_1.polar(p1)));
    }
    else {
        return conjugate(p1);
    }
}
exports.conj = conj;
function hasPowerOfMinusOne(p) {
    if (defs_1.ispower(p) && is_1.isminusone(defs_1.cadr(p))) {
        return true;
    }
    if (defs_1.istensor(p)) {
        return p.tensor.elem.some(hasPowerOfMinusOne);
    }
    return defs_1.iscons(p) && p.tail().some(hasPowerOfMinusOne);
}
// careful is you pass this one an expression with
// i (instead of (-1)^(1/2)) then this doesn't work!
function conjugate(p1) {
    const q = quantity_1.mapQuantity(p1, conjugate);
    if (q) {
        return q;
    }
    return eval_1.Eval(subst_1.subst(p1, defs_1.Constants.imaginaryunit, multiply_1.negate(defs_1.Constants.imaginaryunit)));
}
exports.conjugate = conjugate;
