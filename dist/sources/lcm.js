"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lcm = exports.Eval_lcm = void 0;
const defs_1 = require("../runtime/defs");
const abs_1 = require("./abs");
const guess_1 = require("./guess");
const is_1 = require("./is");
const misc_1 = require("./misc");
const quotient_1 = require("./quotient");
const eval_1 = require("./eval");
const gcd_1 = require("./gcd");
const multiply_1 = require("./multiply");
// Find the least common multiple of two expressions.
function Eval_lcm(p1) {
    p1 = defs_1.cdr(p1);
    let result = eval_1.Eval(defs_1.car(p1));
    if (defs_1.iscons(p1)) {
        result = p1.tail().reduce((a, b) => lcm(a, eval_1.Eval(b)), result);
    }
    return result;
}
exports.Eval_lcm = Eval_lcm;
function lcm(p1, p2) {
    return defs_1.doexpand(yylcm, p1, p2);
}
exports.lcm = lcm;
// lcm = p1 * p2 / gcd. For polynomials the division is done by divpoly,
// divide() would leave the quotient of two sums uncancelled.
function yylcm(p1, p2) {
    const g = gcd_1.gcd(p1, p2);
    if (is_1.isZeroAtomOrTensor(g)) {
        return defs_1.Constants.zero;
    }
    if (defs_1.isrational(p1) && defs_1.isrational(p2)) {
        return abs_1.absval(multiply_1.divide(multiply_1.multiply(p1, p2), g));
    }
    const X = guess_1.guess(g);
    if (is_1.ispolyexpandedform(g, X) && is_1.ispolyexpandedform(p2, X)) {
        const q = quotient_1.divpoly(p2, g, X);
        if (misc_1.equal(multiply_1.multiply(q, g), p2)) {
            return multiply_1.multiply(p1, q);
        }
    }
    return multiply_1.divide(multiply_1.multiply(p1, p2), g);
}
