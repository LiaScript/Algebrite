"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limit = exports.Eval_limit = void 0;
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const bignum_1 = require("./bignum");
const cos_1 = require("./cos");
const eval_1 = require("./eval");
const derivative_1 = require("./derivative");
const denominator_1 = require("./denominator");
const float_1 = require("./float");
const is_1 = require("./is");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const numerator_1 = require("./numerator");
const rationalize_1 = require("./rationalize");
const simplify_1 = require("./simplify");
const subst_1 = require("./subst");
const MAX_LHOPITAL_ITERATIONS = 5;
// Marks "couldn't evaluate at this point" (e.g. division by zero), as
// distinct from a genuine U result — see tryEvalAt().
const INDETERMINATE = Symbol('indeterminate');
// Direct substitution, catching the Error that stop() throws (e.g. on
// division by zero) — this doubles as the indeterminate-form detector,
// since Algebrite has no symbolic infinity/NaN value to check for instead.
function tryEvalAt(expr, X, A) {
    try {
        return eval_1.Eval(subst_1.subst(expr, X, A));
    }
    catch (e) {
        return INDETERMINATE;
    }
}
// tan and log do not stop at their poles, they come back unevaluated as
// tan(1/2*pi) or log(0); substitution then looks like it succeeded.
function hasPole(p) {
    if (!defs_1.iscons(p)) {
        return false;
    }
    if (defs_1.car(p) === symbol_1.symbol(defs_1.TAN) && is_1.isZeroAtomOrTensor(cos_1.cosine(defs_1.cadr(p)))) {
        return true;
    }
    if (defs_1.car(p) === symbol_1.symbol(defs_1.LOG) && is_1.isZeroAtomOrTensor(defs_1.cadr(p))) {
        return true;
    }
    return p.tail().some(hasPole);
}
// limit(expr, x, point): direct substitution, simplify-then-substitute, and
// a bounded L'Hopital fallback for 0/0 forms. The point may be inf or -inf,
// and the result may be inf or -inf. There is no direction argument, so
// user-facing one-sided limits and multivariable limits are out of scope.
function Eval_limit(p1) {
    const F = eval_1.Eval(defs_1.cadr(p1));
    const X = eval_1.Eval(defs_1.caddr(p1));
    const A = eval_1.Eval(defs_1.cadddr(p1));
    // optional 4th arg: a positive number for the limit from the right,
    // a negative one for the limit from the left
    let sides = [-1, 1];
    if (defs_1.caddddr(p1) !== symbol_1.symbol(defs_1.NIL)) {
        const direction = eval_1.Eval(defs_1.caddddr(p1));
        if (!defs_1.isNumericAtom(direction) || is_1.isZeroAtomOrTensor(direction)) {
            run_1.stop('limit: 4th argument must be a positive or negative number');
        }
        sides = [is_1.isnegativenumber(direction) ? -1 : 1];
    }
    return limit(F, X, A, sides);
}
exports.Eval_limit = Eval_limit;
const VANISHING_DENOMINATOR = 'limit: denominator vanishes while numerator does not — limit is infinite or does not exist';
function limit(F, X, A, sides = [-1, 1]) {
    if (A === symbol_1.symbol(defs_1.INF)) {
        return limitAtInfinity(F, X, defs_1.Constants.one);
    }
    if (misc_1.equal(A, multiply_1.negate(symbol_1.symbol(defs_1.INF)))) {
        return limitAtInfinity(F, X, defs_1.Constants.negOne);
    }
    return limitAt(F, X, A, sides);
}
exports.limit = limit;
// x -> +-inf becomes t -> 0 from the right with x = +-1/t (X is reused as t).
// Numerator and denominator are rationalized separately so the powers of t
// cancel; rationalizing the whole quotient leaves nested fractions behind.
function limitAtInfinity(F, X, sign) {
    const at = (p) => rationalize_1.rationalize(eval_1.Eval(subst_1.subst(p, X, multiply_1.divide(sign, X))));
    const G = multiply_1.divide(at(numerator_1.numerator(F)), at(denominator_1.denominator(F)));
    return limitAt(G, X, defs_1.Constants.zero, [1]);
}
// An infinite limit: the sign of F just beside A, on each requested side.
// ponytail: numeric probe at a fixed relative distance, needs a numeric A;
// a symbolic sign analysis would lift both restrictions
function infiniteLimit(F, X, A, sides) {
    const a = float_1.zzfloat(A);
    if (!defs_1.isdouble(a)) {
        run_1.stop(VANISHING_DENOMINATOR);
    }
    const eps = 1e-6 * Math.max(1, Math.abs(a.d));
    const positive = sides.map((side) => {
        const v = float_1.zzfloat(subst_1.subst(F, X, bignum_1.double(a.d + side * eps)));
        if (!defs_1.isdouble(v)) {
            run_1.stop('limit: could not determine a real sign beside the point — try a one-sided limit');
        }
        return v.d > 0;
    });
    if (positive.some((p) => p !== positive[0])) {
        run_1.stop('limit: left and right limits differ — limit does not exist');
    }
    return positive[0] ? symbol_1.symbol(defs_1.INF) : multiply_1.negate(symbol_1.symbol(defs_1.INF));
}
// sides: -1 for the left of A, 1 for the right; only used for infinite limits
function limitAt(F, X, A, sides) {
    let result = tryEvalAt(F, X, A);
    if (result !== INDETERMINATE) {
        return hasPole(result) ? infiniteLimit(F, X, A, sides) : result;
    }
    const simplified = simplify_1.simplify(F);
    result = tryEvalAt(simplified, X, A);
    if (result !== INDETERMINATE) {
        return result;
    }
    let N = numerator_1.numerator(F);
    let D = denominator_1.denominator(F);
    for (let i = 0; i < MAX_LHOPITAL_ITERATIONS; i++) {
        const nAtA = tryEvalAt(N, X, A);
        const dAtA = tryEvalAt(D, X, A);
        // L'Hopital is only valid for 0/0: if either part cannot be evaluated
        // at A, differentiating on would produce a wrong answer
        if (nAtA === INDETERMINATE || dAtA === INDETERMINATE) {
            break;
        }
        if (!is_1.isZeroAtomOrTensor(dAtA)) {
            return multiply_1.divide(nAtA, dAtA);
        }
        if (!is_1.isZeroAtomOrTensor(nAtA)) {
            return infiniteLimit(F, X, A, sides);
        }
        N = derivative_1.derivative(N, X);
        D = derivative_1.derivative(D, X);
    }
    run_1.stop("limit: could not resolve after repeated L'Hopital iterations");
}
