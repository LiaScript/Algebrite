"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zeta = exports.Eval_zeta = exports.Eval_bernoulli = exports.bernoulliNumber = void 0;
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const eval_1 = require("./eval");
const factorial_1 = require("./factorial");
const float_1 = require("./float");
const gamma_1 = require("./gamma");
const is_1 = require("./is");
const list_1 = require("./list");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const power_1 = require("./power");
// bernoulli(n): the Bernoulli numbers with B1 = -1/2, from
// B_m = -1/(m+1) * sum_{j<m} C(m+1,j) B_j
// filled on first use: Constants is not there yet when this module loads
const bernoulliCache = [];
function bernoulliNumber(n) {
    if (bernoulliCache.length === 0) {
        bernoulliCache.push(defs_1.Constants.one);
    }
    for (let m = bernoulliCache.length; m <= n; m++) {
        let acc = defs_1.Constants.zero;
        let binom = defs_1.Constants.one; // C(m+1, j)
        for (let j = 0; j < m; j++) {
            acc = add_1.add(acc, multiply_1.multiply(binom, bernoulliCache[j]));
            binom = multiply_1.divide(multiply_1.multiply(binom, bignum_1.integer(m + 1 - j)), bignum_1.integer(j + 1));
        }
        bernoulliCache.push(multiply_1.negate(multiply_1.divide(acc, bignum_1.integer(m + 1))));
    }
    return bernoulliCache[n];
}
exports.bernoulliNumber = bernoulliNumber;
function Eval_bernoulli(p1) {
    misc_1.checkArgCount(p1, 1);
    const arg = eval_1.Eval(defs_1.cadr(p1));
    const n = bignum_1.nativeInt(arg);
    if (isNaN(n) || n < 0) {
        return list_1.makeList(symbol_1.usr_symbol(defs_1.BERNOULLI), arg);
    }
    return bernoulliNumber(n);
}
exports.Eval_bernoulli = Eval_bernoulli;
function Eval_zeta(p1) {
    misc_1.checkArgCount(p1, 1);
    return zeta(eval_1.Eval(defs_1.cadr(p1)));
}
exports.Eval_zeta = Eval_zeta;
// Riemann zeta: exact at the even positive integers, zeta(2n) =
// (-1)^(n+1) B_2n (2 pi)^(2n) / (2 (2n)!), at 0 and at the negative integers,
// zeta(-n) = -B_(n+1)/(n+1); numeric for a float; otherwise left as it is.
function zeta(s) {
    if (defs_1.isdouble(s)) {
        // the exact values where there are some: the trivial zeros would come
        // out of the numeric formula as rounding noise
        if (Number.isInteger(s.d) && (s.d <= 0 || s.d % 2 === 0) && Math.abs(s.d) < 100) {
            return float_1.zzfloat(zeta(bignum_1.integer(s.d)));
        }
        return bignum_1.double(zetaFloat(s.d));
    }
    if (!is_1.isinteger(s)) {
        return list_1.makeList(symbol_1.usr_symbol(defs_1.ZETA), s);
    }
    const n = bignum_1.nativeInt(s);
    if (n === 1) {
        run_1.stop('zeta: pole at 1');
    }
    if (n === 0) {
        return bignum_1.rational(-1, 2);
    }
    if (n < 0) {
        return multiply_1.negate(multiply_1.divide(bernoulliNumber(1 - n), bignum_1.integer(1 - n)));
    }
    if (n % 2 === 1 || isNaN(n)) {
        return list_1.makeList(symbol_1.usr_symbol(defs_1.ZETA), s);
    }
    const sign = (n / 2) % 2 === 1 ? defs_1.Constants.one : defs_1.Constants.negOne;
    return multiply_1.divide(multiply_1.multiply(multiply_1.multiply(sign, bernoulliNumber(n)), power_1.power(multiply_1.multiply(bignum_1.integer(2), defs_1.Constants.Pi()), s)), multiply_1.multiply(bignum_1.integer(2), factorial_1.factorial(s)));
}
exports.zeta = zeta;
// Euler-Maclaurin: sum_{k<N} k^-s + N^(1-s)/(s-1) + N^-s/2
//   + sum_j B_2j/(2j)! * s(s+1)...(s+2j-2) * N^(-s-2j+1)
function zetaFloat(s) {
    if (s === 1) {
        run_1.stop('zeta: pole at 1');
    }
    // reflection: zeta(s) = 2^s pi^(s-1) sin(pi s/2) Gamma(1-s) zeta(1-s),
    // Euler-Maclaurin with a fixed number of terms degrades for s << 0
    if (s < 0) {
        return (Math.pow(2, s) *
            Math.pow(Math.PI, s - 1) *
            Math.sin((Math.PI * s) / 2) *
            gamma_1.lanczos(1 - s) *
            zetaFloat(1 - s));
    }
    const N = 20;
    let sum = 0;
    for (let k = 1; k < N; k++) {
        sum += Math.pow(k, -s);
    }
    sum += Math.pow(N, 1 - s) / (s - 1) + Math.pow(N, -s) / 2;
    const B2 = [1 / 6, -1 / 30, 1 / 42, -1 / 30, 5 / 66, -691 / 2730, 7 / 6, -3617 / 510];
    let rising = s; // s(s+1)...(s+2j-2)
    let fact = 2; // (2j)!
    for (let j = 1; j <= B2.length; j++) {
        sum += (B2[j - 1] / fact) * rising * Math.pow(N, -s - 2 * j + 1);
        rising *= (s + 2 * j - 1) * (s + 2 * j);
        fact *= (2 * j + 1) * (2 * j + 2);
    }
    return sum;
}
