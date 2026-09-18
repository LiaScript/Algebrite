"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.binomial = exports.Eval_binomial = void 0;
const defs_1 = require("../runtime/defs");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const eval_1 = require("./eval");
const factorial_1 = require("./factorial");
const is_1 = require("./is");
const list_1 = require("./list");
const multiply_1 = require("./multiply");
//  Binomial coefficient
//
//  binomial(n, k) = n! / k! / (n - k)!
//
//  generalized as in Concrete Mathematics (5.1): for integer k >= 0 it is
//  n (n - 1) ... (n - k + 1) / k!, which also holds for negative and
//  fractional n, and it vanishes for integer k < 0.
function Eval_binomial(p1) {
    const N = eval_1.Eval(defs_1.cadr(p1));
    const K = eval_1.Eval(defs_1.caddr(p1));
    return binomial(N, K);
}
exports.Eval_binomial = Eval_binomial;
function binomial(N, K) {
    const k = bignum_1.nativeInt(K);
    if (k < 0) {
        return defs_1.Constants.zero;
    }
    if (defs_1.isNumericAtom(N) && !isNaN(k)) {
        let result = defs_1.Constants.one;
        for (let j = 0; j < k; j++) {
            result = multiply_1.divide(multiply_1.multiply(result, add_1.subtract(N, bignum_1.integer(j))), bignum_1.integer(j + 1));
        }
        return result;
    }
    // n! has a pole at negative integers, the factorial form is meaningless
    if (is_1.isinteger(N) && is_1.isnegativenumber(N)) {
        return list_1.makeList(symbol_1.symbol(defs_1.BINOMIAL), N, K);
    }
    return multiply_1.divide(multiply_1.divide(factorial_1.factorial(N), factorial_1.factorial(K)), factorial_1.factorial(add_1.subtract(N, K)));
}
exports.binomial = binomial;
