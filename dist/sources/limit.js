"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limit = exports.Eval_limit = void 0;
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const eval_1 = require("./eval");
const derivative_1 = require("./derivative");
const denominator_1 = require("./denominator");
const is_1 = require("./is");
const multiply_1 = require("./multiply");
const numerator_1 = require("./numerator");
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
// limit(expr, x, point): only the point form (no direction argument),
// covering direct substitution, simplify-then-substitute, and a bounded
// L'Hopital fallback for 0/0 forms. Limits at infinity, multivariable
// limits, and one-sided limits are out of scope.
function Eval_limit(p1) {
    const F = eval_1.Eval(defs_1.cadr(p1));
    const X = eval_1.Eval(defs_1.caddr(p1));
    const A = eval_1.Eval(defs_1.cadddr(p1));
    return limit(F, X, A);
}
exports.Eval_limit = Eval_limit;
function limit(F, X, A) {
    let result = tryEvalAt(F, X, A);
    if (result !== INDETERMINATE) {
        return result;
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
        if (dAtA !== INDETERMINATE && !is_1.isZeroAtomOrTensor(dAtA) && nAtA !== INDETERMINATE) {
            return multiply_1.divide(nAtA, dAtA);
        }
        if (dAtA !== INDETERMINATE && is_1.isZeroAtomOrTensor(dAtA) && nAtA !== INDETERMINATE && !is_1.isZeroAtomOrTensor(nAtA)) {
            run_1.stop('limit: denominator vanishes while numerator does not — limit is infinite or does not exist');
        }
        N = derivative_1.derivative(N, X);
        D = derivative_1.derivative(D, X);
    }
    run_1.stop("limit: could not resolve after repeated L'Hopital iterations");
}
exports.limit = limit;
