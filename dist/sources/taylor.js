"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_taylor = void 0;
const defs_1 = require("../runtime/defs");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const derivative_1 = require("./derivative");
const eval_1 = require("./eval");
const factorial_1 = require("./factorial");
const guess_1 = require("./guess");
const is_1 = require("./is");
const denominator_1 = require("./denominator");
const numerator_1 = require("./numerator");
const power_1 = require("./power");
const list_1 = require("./list");
const multiply_1 = require("./multiply");
const subst_1 = require("./subst");
const misc_1 = require("./misc");
/*
Taylor expansion of a function

  push(F)
  push(X)
  push(N)
  push(A)
  taylor()
*/
function Eval_taylor(p1) {
    misc_1.checkArgCount(p1, 1, 4);
    // 1st arg
    p1 = defs_1.cdr(p1);
    const F = eval_1.Eval(defs_1.car(p1));
    // 2nd arg
    p1 = defs_1.cdr(p1);
    let p2 = eval_1.Eval(defs_1.car(p1));
    const X = p2 === symbol_1.symbol(defs_1.NIL) ? guess_1.guess(F) : p2;
    // 3rd arg
    p1 = defs_1.cdr(p1);
    p2 = eval_1.Eval(defs_1.car(p1));
    const N = p2 === symbol_1.symbol(defs_1.NIL) ? bignum_1.integer(24) : p2; // 24: default number of terms
    // 4th arg
    p1 = defs_1.cdr(p1);
    p2 = eval_1.Eval(defs_1.car(p1));
    const A = p2 === symbol_1.symbol(defs_1.NIL) ? defs_1.Constants.zero : p2; // 0: default expansion point
    return taylor(F, X, N, A);
}
exports.Eval_taylor = Eval_taylor;
function taylor(F, X, N, A) {
    const k = bignum_1.nativeInt(N);
    if (isNaN(k)) {
        return list_1.makeList(symbol_1.symbol(defs_1.TAYLOR), F, X, N, A);
    }
    try {
        return regularTaylor(F, X, k, A);
    }
    catch (e) {
        // not analytic at A: a removable singularity or a pole still has a
        // (Laurent) series, from dividing numerator and denominator series
        const q = quotientSeries(F, X, k, A);
        if (q === undefined) {
            throw e;
        }
        return q;
    }
}
function regularTaylor(F, X, k, A) {
    let p5 = defs_1.Constants.one;
    let temp = eval_1.Eval(subst_1.subst(F, X, A)); // F: f(a)
    for (let i = 1; i <= k; i++) {
        F = derivative_1.derivative(F, X); // F: f = f'
        if (is_1.isZeroAtomOrTensor(F)) {
            break;
        }
        // c = c * (x - a)
        p5 = multiply_1.multiply(p5, add_1.subtract(X, A));
        const arg1a = eval_1.Eval(subst_1.subst(F, X, A)); // F: f(a)
        temp = add_1.add(temp, multiply_1.divide(multiply_1.multiply(arg1a, p5), factorial_1.factorial(bignum_1.integer(i))));
    }
    return temp;
}
// the Taylor coefficients of F at A, one per call
function coefficients(F, X, A) {
    let i = 0;
    return () => {
        const c = multiply_1.divide(eval_1.Eval(subst_1.subst(F, X, A)), factorial_1.factorial(bignum_1.integer(i)));
        F = derivative_1.derivative(F, X);
        i++;
        return c;
    };
}
// F = num/den with num = (X-A)^n0 * (n_0 + n_1 (X-A) + ...) and the same for
// den with d0: the quotient series q_j = (n_j - sum_{i=1..j} d_i q_(j-i)) / d_0
// times (X-A)^(n0-d0), up to the power k. undefined when F is no quotient or
// a series does not start within MAX_ORDER terms.
const MAX_ORDER = 12;
function quotientSeries(F, X, k, A) {
    const den = denominator_1.denominator(F);
    if (is_1.isone(den)) {
        return undefined;
    }
    let nextN;
    let nextD;
    let n;
    let d;
    let n0 = 0;
    let d0 = 0;
    try {
        nextN = coefficients(numerator_1.numerator(F), X, A);
        nextD = coefficients(den, X, A);
        n = [nextN()];
        d = [nextD()];
        for (; is_1.isZeroAtomOrTensor(n[0]); n0++) {
            if (n0 === MAX_ORDER) {
                return undefined;
            }
            n = [nextN()];
        }
        for (; is_1.isZeroAtomOrTensor(d[0]); d0++) {
            if (d0 === MAX_ORDER) {
                return undefined;
            }
            d = [nextD()];
        }
        const shift = n0 - d0;
        const q = [];
        let result = defs_1.Constants.zero;
        let pow = defs_1.Constants.one; // (X-A)^j, expanded like regularTaylor does
        for (let j = 0; j + shift <= k; j++) {
            if (j > 0) {
                n.push(nextN());
                d.push(nextD());
                pow = multiply_1.multiply(pow, add_1.subtract(X, A));
            }
            let c = n[j];
            for (let i = 1; i <= j; i++) {
                c = add_1.subtract(c, multiply_1.multiply(d[i], q[j - i]));
            }
            q.push(multiply_1.divide(c, d[0]));
            const e = j + shift;
            const term = e >= 0
                ? multiply_1.multiply(q[j], e === j ? pow : power_1.power(add_1.subtract(X, A), bignum_1.integer(e)))
                : multiply_1.multiply(q[j], power_1.power(add_1.subtract(X, A), bignum_1.integer(e)));
            result = add_1.add(result, e >= 0 && e !== j ? eval_1.Eval(term) : term);
        }
        return result;
    }
    catch (e) {
        return undefined;
    }
}
