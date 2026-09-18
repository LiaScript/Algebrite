"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_mod = void 0;
const assume_1 = require("./assume");
const multiply_1 = require("./multiply");
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const bignum_1 = require("./bignum");
const eval_1 = require("./eval");
const is_1 = require("./is");
const list_1 = require("./list");
const mmul_1 = require("./mmul");
function Eval_mod(p1) {
    const arg1 = eval_1.Eval(defs_1.cadr(p1));
    let arg2 = eval_1.Eval(defs_1.caddr(p1));
    return mod(arg1, arg2);
}
exports.Eval_mod = Eval_mod;
function mod(p1, p2) {
    if (is_1.isZeroAtomOrTensor(p2)) {
        run_1.stop('mod function: divide by zero');
    }
    // mod(k*m, m) = 0 for integers k and m, with k known from the assumptions
    if (!defs_1.isNumericAtom(p1) && is_1.isinteger(p2) && assume_1.isInteger(multiply_1.divide(p1, p2))) {
        return defs_1.Constants.zero;
    }
    if (!defs_1.isNumericAtom(p1) || !defs_1.isNumericAtom(p2)) {
        return list_1.makeList(symbol_1.symbol(defs_1.MOD), p1, p2);
    }
    if (defs_1.isdouble(p1)) {
        const n = bignum_1.nativeInt(p1);
        if (isNaN(n)) {
            run_1.stop('mod function: cannot convert float value to integer');
        }
        p1 = bignum_1.integer(n);
    }
    if (defs_1.isdouble(p2)) {
        const n = bignum_1.nativeInt(p2);
        if (isNaN(n)) {
            run_1.stop('mod function: cannot convert float value to integer');
        }
        p2 = bignum_1.integer(n);
    }
    if (!is_1.isinteger(p1) || !is_1.isinteger(p2)) {
        run_1.stop('mod function: integer arguments expected');
    }
    // mmod truncates (sign of the dividend); the result takes the sign of the
    // divisor instead, as in Maxima, Mathematica and SymPy: mod(-7,3) = 2
    const r = mmul_1.mmod(p1.q.a, p2.q.a);
    const flip = !r.isZero() && r.isNegative() !== p2.q.a.isNegative();
    return new defs_1.Num(flip ? r.add(p2.q.a) : r);
}
