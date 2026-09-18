"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limit = exports.Eval_limit = void 0;
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const bignum_1 = require("./bignum");
const cos_1 = require("./cos");
const eval_1 = require("./eval");
const derivative_1 = require("./derivative");
const denominator_1 = require("./denominator");
const float_1 = require("./float");
const is_1 = require("./is");
const list_1 = require("./list");
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
    misc_1.checkArgCount(p1, 3, 4);
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
    const direct = atInfinity(F, X, sign);
    if (direct !== undefined) {
        return direct;
    }
    const lhopital = lhopitalAtInfinity(F, X, sign);
    if (lhopital !== undefined) {
        return lhopital;
    }
    const at = (p) => rationalize_1.rationalize(eval_1.Eval(subst_1.subst(p, X, multiply_1.divide(sign, X))));
    const G = multiply_1.divide(at(numerator_1.numerator(F)), at(denominator_1.denominator(F)));
    return limitAt(G, X, defs_1.Constants.zero, [1]);
}
const isInfinite = (p) => p === symbol_1.symbol(defs_1.INF) || misc_1.equal(p, multiply_1.negate(symbol_1.symbol(defs_1.INF)));
// F at x = +-inf: substituted, with the functions that have a value at
// +-inf replaced by it. Returns undefined for an indeterminate form or when
// something of inf is left over (sin(inf) has no value).
function atInfinity(F, X, sign) {
    try {
        // not evaluated as a whole first: that would turn (1+1/inf)^inf into 1
        const v = resolveInf(subst_1.subst(F, X, multiply_1.multiply(sign, symbol_1.symbol(defs_1.INF))));
        if (!find_1.Find(v, symbol_1.symbol(defs_1.INF)) || isInfinite(v)) {
            return v;
        }
        // inf times a nonzero constant, e.g. inf*pi
        const f = float_1.zzfloat(v);
        if (isInfinite(f)) {
            return f;
        }
        if (defs_1.isdouble(f) && Math.abs(f.d) === Infinity) {
            return f.d > 0 ? symbol_1.symbol(defs_1.INF) : multiply_1.negate(symbol_1.symbol(defs_1.INF));
        }
    }
    catch (e) {
        // indeterminate form, e.g. inf-inf or 0*inf
    }
    return undefined;
}
// Bottom-up: exp(-inf) = 0, 2^inf = inf, arctan(inf) = pi/2, erf(-inf) = -1,
// log(inf) = inf, ... Indeterminate forms stop (caught by the caller):
// arithmetic ones in Eval, the powers 1^inf, inf^0 and 0^0 here, since
// Eval would give 1 for them.
function resolveInf(p) {
    if (!defs_1.iscons(p)) {
        return p;
    }
    const head = defs_1.car(p);
    const args = p.tail().map(resolveInf);
    // something of inf without a value (sin(inf)) could be anything, even
    // infinite: 0*sin(inf) or abs(inf)/inf must not evaluate to 0
    if (args.some((a) => find_1.Find(a, symbol_1.symbol(defs_1.INF)) && !isInfinite(a))) {
        run_1.stop('limit: no value at inf');
    }
    const inf = symbol_1.symbol(defs_1.INF);
    const [arg, exponent] = args;
    if (head === symbol_1.symbol(defs_1.POWER)) {
        if ((isInfinite(exponent) && is_1.isplusone(arg)) ||
            (is_1.isZeroAtomOrTensor(exponent) &&
                (isInfinite(arg) || is_1.isZeroAtomOrTensor(arg)))) {
            run_1.stop('limit: indeterminate power');
        }
        if (isInfinite(exponent)) {
            const base = arg === symbol_1.symbol(defs_1.E) ? bignum_1.double(Math.E) : float_1.zzfloat(arg);
            if (defs_1.isdouble(base) && base.d > 0) {
                return (base.d > 1) === (exponent === inf) ? inf : defs_1.Constants.zero;
            }
        }
    }
    // before Eval, which would turn arctan(-inf) into -arctan(inf)
    if (args.length === 1 && isInfinite(arg)) {
        const s = arg === inf ? defs_1.Constants.one : defs_1.Constants.negOne;
        switch (head) {
            case symbol_1.symbol(defs_1.ARCTAN):
                return multiply_1.multiply(s, multiply_1.divide(defs_1.Constants.Pi(), bignum_1.integer(2)));
            case symbol_1.symbol(defs_1.TANH):
            case symbol_1.symbol(defs_1.ERF):
            case symbol_1.symbol(defs_1.SGN):
                return s;
            case symbol_1.symbol(defs_1.ERFC):
                return arg === inf ? defs_1.Constants.zero : bignum_1.integer(2);
            case symbol_1.symbol(defs_1.SINH):
                return arg;
            case symbol_1.symbol(defs_1.COSH):
            case symbol_1.symbol(defs_1.ABS):
                return inf;
            case symbol_1.symbol(defs_1.LOG):
                if (arg === inf) {
                    return inf;
                }
        }
    }
    return eval_1.Eval(list_1.makeList(head, ...args));
}
// L'Hopital directly in x for inf/inf and 0/0 at infinity (x*exp(-x) is
// x/exp(x)); undefined when it does not come to a result.
function lhopitalAtInfinity(F, X, sign) {
    let N = numerator_1.numerator(F);
    let D = denominator_1.denominator(F);
    for (let i = 0; i < MAX_LHOPITAL_ITERATIONS; i++) {
        const n = atInfinity(N, X, sign);
        const d = atInfinity(D, X, sign);
        if (n === undefined || d === undefined) {
            return undefined;
        }
        const bothZero = is_1.isZeroAtomOrTensor(n) && is_1.isZeroAtomOrTensor(d);
        if (!bothZero && !(isInfinite(n) && isInfinite(d))) {
            return is_1.isZeroAtomOrTensor(d) ? undefined : multiply_1.divide(n, d);
        }
        // the quotient of the derivatives is normalized before it is taken
        // apart again: 2*x/(x^2+1) / (1/x) is 2*x^2/(x^2+1)
        const G = multiply_1.divide(derivative_1.derivative(N, X), derivative_1.derivative(D, X));
        N = numerator_1.numerator(G);
        D = denominator_1.denominator(G);
    }
    return undefined;
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
// not a module-level list: this file is loaded inside a circular import,
// before the names in defs are initialised
function isJumpFunction(head) {
    return [defs_1.SGN, defs_1.ABS, defs_1.FLOOR, defs_1.CEILING].some((f) => head === symbol_1.symbol(f));
}
function hasJump(p) {
    return defs_1.iscons(p) && (isJumpFunction(defs_1.car(p)) || p.tail().some(hasJump));
}
// On one side of the point a jump function is smooth: sgn(g) is a constant,
// abs(g) is g or -g, floor(g) and ceiling(g) are constants. The value of g
// just beside the point says which. Nodes whose g cannot be evaluated
// numerically there (symbolic coefficients) are left as they are.
function resolveJumps(p, X, beside) {
    if (!defs_1.iscons(p)) {
        return p;
    }
    const head = defs_1.car(p);
    if (isJumpFunction(head)) {
        const g = defs_1.cadr(p);
        const v = float_1.zzfloat(subst_1.subst(g, X, bignum_1.double(beside)));
        if (defs_1.isdouble(v)) {
            const inner = resolveJumps(g, X, beside);
            switch (head) {
                case symbol_1.symbol(defs_1.SGN):
                    return bignum_1.integer(Math.sign(v.d));
                case symbol_1.symbol(defs_1.ABS):
                    return v.d < 0 ? multiply_1.negate(inner) : inner;
                case symbol_1.symbol(defs_1.FLOOR):
                    return bignum_1.integer(Math.floor(v.d));
                default:
                    return bignum_1.integer(Math.ceil(v.d));
            }
        }
    }
    return list_1.makeList(head, ...p.tail().map((q) => resolveJumps(q, X, beside)));
}
// With jump functions present the value at the point says nothing about the
// limit, and L'Hopital does not apply. Each side is solved on its own, with
// the jumps resolved for that side, and the sides must agree. Returns
// undefined when the jumps could not all be resolved.
function limitWithJumps(F, X, A, sides) {
    const a = float_1.zzfloat(A);
    if (!defs_1.isdouble(a)) {
        return undefined;
    }
    const eps = 1e-6 * Math.max(1, Math.abs(a.d));
    const results = [];
    for (const side of sides) {
        const smooth = eval_1.Eval(resolveJumps(F, X, a.d + side * eps));
        if (hasJump(smooth)) {
            return undefined;
        }
        results.push(limitAt(smooth, X, A, [side]));
    }
    if (results.some((r) => !misc_1.equal(r, results[0]))) {
        run_1.stop('limit: left and right limits differ — limit does not exist');
    }
    return results[0];
}
// sides: -1 for the left of A, 1 for the right
function limitAt(F, X, A, sides) {
    if (hasJump(F)) {
        const resolved = limitWithJumps(F, X, A, sides);
        if (resolved !== undefined) {
            return resolved;
        }
    }
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
