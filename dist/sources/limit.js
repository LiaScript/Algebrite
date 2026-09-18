"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limit = exports.Eval_limit = void 0;
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const assume_1 = require("./assume");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const bignum_1 = require("./bignum");
const condense_1 = require("./condense");
const cos_1 = require("./cos");
const sin_1 = require("./sin");
const degree_1 = require("./degree");
const eval_1 = require("./eval");
const derivative_1 = require("./derivative");
const denominator_1 = require("./denominator");
const float_1 = require("./float");
const is_1 = require("./is");
const add_1 = require("./add");
const lcm_1 = require("./lcm");
const log_1 = require("./log");
const piecewise_1 = require("./piecewise");
const power_1 = require("./power");
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
        return evalWatchingPoles(subst_1.subst(expr, X, A));
    }
    catch (e) {
        return INDETERMINATE;
    }
}
// log and arctanh do not stop at their poles, they come back unevaluated as
// log(0) or arctanh(1); substitution then looks like it succeeded.
function hasPole(p) {
    if (!defs_1.iscons(p)) {
        return false;
    }
    if (defs_1.car(p) === symbol_1.symbol(defs_1.LOG) && is_1.isZeroAtomOrTensor(defs_1.cadr(p))) {
        return true;
    }
    if (defs_1.car(p) === symbol_1.symbol(defs_1.ARCTANH) && (is_1.isplusone(defs_1.cadr(p)) || is_1.isminusone(defs_1.cadr(p)))) {
        return true;
    }
    return p.tail().some(hasPole);
}
// Every log(0) is the same expression, whatever went to 0 inside and how
// fast: log(0)/log(0) = 1 and log(0)-log(0) = 0 say nothing about the limit
// (log(x)/log(x^3+x^2) goes to 1/2). Sums, products and powers are evaluated
// bottom-up, and two poles meeting in one of them stop, as inf-inf does.
// A pole times an exact 0 stays 0: a logarithm loses against every power.
function evalWatchingPoles(p) {
    const arithmetic = defs_1.isadd(p) || defs_1.ismultiply(p) || defs_1.ispower(p);
    if (!defs_1.iscons(p) || !arithmetic || !(find_1.Find(p, symbol_1.symbol(defs_1.LOG)) || find_1.Find(p, symbol_1.symbol(defs_1.ARCTANH)))) {
        return eval_1.Eval(p);
    }
    const args = p.tail().map(evalWatchingPoles);
    const polar = args.filter(hasPole);
    const plainPower = defs_1.ispower(p) && !hasPole(args[1]) && defs_1.isNumericAtom(args[1]) && !is_1.isZeroAtomOrTensor(args[1]);
    if (polar.length > 1 || (defs_1.ispower(p) && polar.length > 0 && !plainPower)) {
        run_1.stop('limit: poles meet');
    }
    return eval_1.Eval(list_1.makeList(defs_1.car(p), ...args));
}
// The pole makes the whole expression infinite: it is the expression, a
// term, a factor (a zero factor would have evaluated to 0 already) or the
// base of a positive power. Inside any other function it does not:
// sin(log(0)) is bounded, 1/log(0) is 0.
function isInfiniteAtPole(p) {
    if (defs_1.isadd(p) || defs_1.ismultiply(p)) {
        return p.tail().some(isInfiniteAtPole);
    }
    if (defs_1.ispower(p)) {
        return is_1.ispositivenumber(defs_1.caddr(p)) && isInfiniteAtPole(defs_1.cadr(p));
    }
    return defs_1.iscons(p) && hasPole(p) && !p.tail().some(hasPole);
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
    const side = defs_1.caddddr(p1);
    const sideName = defs_1.issymbol(side) ? side.printname : '';
    if (sideName === 'left' || sideName === 'right') {
        sides = [sideName === 'left' ? -1 : 1];
    }
    else if (side !== symbol_1.symbol(defs_1.NIL)) {
        const direction = eval_1.Eval(side);
        if (!defs_1.isNumericAtom(direction) || is_1.isZeroAtomOrTensor(direction)) {
            run_1.stop('limit: 4th argument must be left, right or a positive or negative number');
        }
        sides = [is_1.isnegativenumber(direction) ? -1 : 1];
    }
    return limit(F, X, A, sides);
}
exports.Eval_limit = Eval_limit;
const VANISHING_DENOMINATOR = 'limit: denominator vanishes while numerator does not — limit is infinite or does not exist';
// The fallbacks call limit() on parts of F, and each other, and ask the same
// questions again and again (the limit of sin(1/x) for the squeeze, the
// factors, the jump functions, the oscillation): within one top-level call
// the answers, and the failures, are remembered. What the answer depends on
// besides the arguments is part of the key.
let depth = 0;
const memo = new Map();
function limit(F, X, A, sides = [-1, 1]) {
    if (depth > 20) {
        run_1.stop('limit: nested too deeply');
    }
    const context = [JSON.stringify(assume_1.facts(X)), inverting, probing, lhopitalOnceRunning];
    const key = [F, X, A, sides, ...context].join('|');
    const known = memo.get(key);
    if (known instanceof Error) {
        throw known;
    }
    if (known !== undefined) {
        return known;
    }
    depth++;
    try {
        const result = limitGuarded(F, X, A, sides);
        memo.set(key, result);
        return result;
    }
    catch (e) {
        memo.set(key, e);
        throw e;
    }
    finally {
        if (--depth === 0) {
            memo.clear();
        }
    }
}
exports.limit = limit;
function limitGuarded(F, X, A, sides) {
    if (isInfinite(A) && piecewise_1.hasPiecewise(F)) {
        // ponytail: the branch at +-1e9 is taken for the one near +-inf
        const G = piecewise_1.resolvePiecewise(F, X, bignum_1.double(A === symbol_1.symbol(defs_1.INF) ? 1e9 : -1e9));
        F = G === undefined ? F : eval_1.Eval(G);
    }
    F = unboundFloors(F, X, A, sides);
    const viaExp = powerLimit(F, X, A, sides);
    if (viaExp !== undefined) {
        return viaExp;
    }
    try {
        return limitCore(F, X, A, sides);
    }
    catch (e) {
        // the evaluator expands (x-1)*sin(1/(x-1)); the factors are needed
        const C = defs_1.isadd(F) ? condense_1.Condense(F) : F;
        const r = squeeze(F, X, A, sides) ||
            (defs_1.ismultiply(C) ? squeeze(C, X, A, sides) : undefined) ||
            termwise(F, X, A, sides) ||
            combineLogs(F, X, A, sides) ||
            boundedPlusInfinite(F, X, A, sides) ||
            factorwise(F, X, A, sides) ||
            compose(F, X, A, sides) ||
            viaKernel(F, X, A, sides) ||
            leadingTerm(F, X, A, sides) ||
            expProduct(F, X, A, sides) ||
            invert(F, X, A, sides) ||
            lhopitalOnce(F, X, A, sides);
        if (r !== undefined) {
            return r;
        }
        const wave = oscillating(F, X, A, sides);
        if (wave !== undefined) {
            run_1.stop(`limit: the limit does not exist: ${wave} oscillates`);
        }
        // each side on its own: 1/tan(x) at pi/2, where tan has two limits
        if (sides.length === 2) {
            let each;
            try {
                each = sides.map((side) => limit(F, X, A, [side]));
            }
            catch (e2) {
                throw e;
            }
            if (!misc_1.equal(each[0], each[1])) {
                run_1.stop('limit: left and right limits differ — limit does not exist');
            }
            return each[0];
        }
        throw e;
    }
}
// sin(g) or cos(g), also to a positive integer power, with a continuous g
// that goes to +-inf on one of the sides, takes the values 0 and 1 again and
// again: no limit. The same holds for it times a factor with a nonzero or
// infinite limit, and for it plus terms with a finite limit. Returns the
// sin(g) or cos(g) in question. (Times a factor that goes to 0 the limit
// is 0, see squeeze.)
function oscillating(F, X, A, sides) {
    const limitOf = (f, side) => {
        try {
            return limit(f, X, A, [side]);
        }
        catch (e) {
            return undefined;
        }
    };
    const onSide = (f, side) => {
        if (defs_1.ispower(f) && is_1.isposint(defs_1.caddr(f))) {
            return onSide(defs_1.cadr(f), side);
        }
        const toInfinity = (g) => {
            const L = find_1.Find(g, X) && !hasJump(g, X) && limitOf(g, side);
            return !!L && isInfinite(L);
        };
        if (defs_1.car(f) === symbol_1.symbol(defs_1.SIN) || defs_1.car(f) === symbol_1.symbol(defs_1.COS)) {
            return toInfinity(defs_1.cadr(f)) ? f : undefined;
        }
        // the fractional part mod(g,1), see unboundFloors
        if (defs_1.car(f) === symbol_1.symbol(defs_1.MOD) && !find_1.Find(defs_1.caddr(f), X)) {
            return toInfinity(defs_1.cadr(f)) ? f : undefined;
        }
        // (-1)^floor(g) is 1 and -1 again and again
        if (defs_1.ispower(f) && is_1.isnegativenumber(defs_1.cadr(f)) && isRounding(defs_1.car(defs_1.caddr(f)))) {
            return toInfinity(defs_1.cadr(defs_1.caddr(f))) ? f : undefined;
        }
        // sgn, floor, ceiling and round of a wave around 0 jump with it (of a
        // sum they need not: sgn(2+sin(x)) is 1), abs of a wave is a wave
        if (defs_1.iscons(f) && isJumpFunction(defs_1.car(f)) && defs_1.car(f) !== symbol_1.symbol(defs_1.MOD)) {
            const inner = defs_1.cadr(f);
            return defs_1.car(f) === symbol_1.symbol(defs_1.ABS) || !defs_1.isadd(inner) ? onSide(inner, side) : undefined;
        }
        if (!defs_1.ismultiply(f) && !defs_1.isadd(f)) {
            return undefined;
        }
        // exactly one part oscillates, the others together have a limit
        const parts = f.tail();
        const waves = parts.filter((q) => onSide(q, side) !== undefined);
        if (waves.length !== 1) {
            return undefined;
        }
        const others = parts.filter((q) => q !== waves[0]);
        const L = limitOf(defs_1.ismultiply(f) ? multiply_1.multiply_all(others) : others.reduce(add_1.add, defs_1.Constants.zero), side);
        const keeps = L !== undefined &&
            (defs_1.ismultiply(f) ? isInfinite(L) || assume_1.isNonzero(L) === true : !find_1.Find(L, symbol_1.symbol(defs_1.INF)));
        return keeps ? onSide(waves[0], side) : undefined;
    };
    for (const side of sides) {
        const wave = onSide(F, side);
        if (wave !== undefined) {
            return wave;
        }
    }
    return undefined;
}
// f^g with X in base and exponent (1^inf, inf^0, 0^0): exp(limit(g*log(f)))
function powerLimit(F, X, A, sides) {
    if (!defs_1.ispower(F) || !find_1.Find(defs_1.cadr(F), X) || !find_1.Find(defs_1.caddr(F), X)) {
        return undefined;
    }
    try {
        const L = limit(multiply_1.multiply(defs_1.caddr(F), log_1.logarithm(defs_1.cadr(F))), X, A, sides);
        if (L === symbol_1.symbol(defs_1.INF)) {
            return L;
        }
        return isInfinite(L) ? defs_1.Constants.zero : misc_1.exponential(L);
    }
    catch (e) {
        return undefined;
    }
}
// bounded on the whole real line
function isBounded(f, X) {
    if (!defs_1.iscons(f) || !find_1.Find(f, X)) {
        return !find_1.Find(f, X);
    }
    const head = defs_1.car(f);
    if ([defs_1.SIN, defs_1.COS, defs_1.SGN, defs_1.ARCTAN, defs_1.TANH, defs_1.ERF].some((name) => head === symbol_1.symbol(name))) {
        return true;
    }
    if (head === symbol_1.symbol(defs_1.MOD)) {
        return !find_1.Find(defs_1.caddr(f), X);
    }
    if (isJumpFunction(head) || defs_1.isadd(f) || defs_1.ismultiply(f)) {
        return f.tail().every((q) => isBounded(q, X));
    }
    return defs_1.ispower(f) && is_1.isposint(defs_1.caddr(f)) && isBounded(defs_1.cadr(f), X);
}
// bounded factors times a rest that goes to 0: sin(x)/x at inf, x*sin(1/x)
// at 0. Among bounded factors alone one that goes to 0 is enough:
// sin(x)*sin(1/x) at 0.
function squeeze(F, X, A, sides) {
    const factors = defs_1.ismultiply(F) ? F.tail() : [F];
    const bounded = factors.filter((f) => find_1.Find(f, X) && isBounded(f, X));
    if (bounded.length === 0) {
        return undefined;
    }
    const goesToZero = (f) => {
        try {
            return is_1.isZeroAtomOrTensor(limit(f, X, A, sides));
        }
        catch (e) {
            return false;
        }
    };
    const rest = factors.filter((f) => !bounded.includes(f));
    const squeezed = rest.some((f) => find_1.Find(f, X))
        ? goesToZero(multiply_1.multiply_all(rest))
        : bounded.length > 1 && bounded.some(goesToZero);
    return squeezed ? defs_1.Constants.zero : undefined;
}
// inf-inf between logarithms: log(a)-log(b) is log(a/b), for a and b of the
// same sign; with a positive limit of a/b that was the case.
function combineLogs(F, X, A, sides) {
    var _a;
    if (!defs_1.isadd(F)) {
        return undefined;
    }
    // [c, g] of a term c*log(g) with c free of X
    const logPart = (t) => {
        const factors = defs_1.ismultiply(t) ? t.tail() : [t];
        const withX = factors.filter((f) => find_1.Find(f, X));
        return withX.length === 1 && defs_1.car(withX[0]) === symbol_1.symbol(defs_1.LOG)
            ? [multiply_1.multiply_all(factors.filter((f) => f !== withX[0])), defs_1.cadr(withX[0])]
            : undefined;
    };
    // the logs whose coefficient is a rational multiple q of the first one,
    // c: 1/5*log(a)+1/5*log(b), log(a)/sqrt(3)-log(b)/sqrt(3)
    const c = (_a = F.tail().map(logPart).find((cg) => cg !== undefined)) === null || _a === void 0 ? void 0 : _a[0];
    const multiple = (t) => {
        const cg = logPart(t);
        const q = cg && multiply_1.divide(cg[0], c);
        return q && defs_1.isrational(q) ? q : undefined;
    };
    const logs = F.tail().filter((t) => multiple(t) !== undefined);
    if (logs.length < 2) {
        return undefined;
    }
    // the common denominator d stays outside, the powers inside are integers
    const d = logs.map((t) => denominator_1.denominator(multiple(t))).reduce(lcm_1.lcm, defs_1.Constants.one);
    const outside = multiply_1.divide(c, d);
    try {
        const inside = multiply_1.multiply_all(logs.map((t) => power_1.power(logPart(t)[1], multiply_1.multiply(multiple(t), d))));
        const rest = F.tail().filter((t) => !logs.includes(t)).reduce(add_1.add, defs_1.Constants.zero);
        const L = limit(inside, X, A, sides);
        const R = limit(rest, X, A, sides);
        if (find_1.Find(R, symbol_1.symbol(defs_1.INF))) {
            return undefined;
        }
        if (L === symbol_1.symbol(defs_1.INF) || is_1.isZeroAtomOrTensor(L)) {
            // +-inf times outside: its sign must be known
            const up = (L === symbol_1.symbol(defs_1.INF)) === (assume_1.isPositive(outside) === true);
            return assume_1.isPositive(outside) === true || assume_1.isNegative(outside) === true
                ? up ? symbol_1.symbol(defs_1.INF) : multiply_1.negate(symbol_1.symbol(defs_1.INF))
                : undefined;
        }
        return assume_1.isPositive(L) === true ? add_1.add(multiply_1.multiply(outside, log_1.logarithm(L)), R) : undefined;
    }
    catch (e) {
        return undefined;
    }
}
// bounded terms plus a rest that goes to +-inf: sin(x)+x
function boundedPlusInfinite(F, X, A, sides) {
    if (!defs_1.isadd(F)) {
        return undefined;
    }
    const rest = F.tail().filter((t) => !isBounded(t, X));
    if (rest.length === 0 || rest.length === F.tail().length) {
        return undefined;
    }
    try {
        const L = limit(rest.reduce(add_1.add, defs_1.Constants.zero), X, A, sides);
        return isInfinite(L) ? L : undefined;
    }
    catch (e) {
        return undefined;
    }
}
// N/D at +-inf with a sum D: both divided by a term of D, so that the
// bounded and the smaller terms go to 0: (x+sin(x))/(x+cos(x)) by x
function leadingTerm(F, X, A, sides) {
    const N = numerator_1.numerator(F);
    const D = denominator_1.denominator(F);
    if (!isInfinite(A) || !defs_1.isadd(D) || D.tail().length > 4) {
        return undefined;
    }
    for (const T of D.tail().filter((t) => find_1.Find(t, X))) {
        try {
            const d = limit(multiply_1.divide(D, T), X, A, sides);
            if (find_1.Find(d, symbol_1.symbol(defs_1.INF)) || is_1.isZeroAtomOrTensor(d)) {
                continue;
            }
            const q = signedInf(multiply_1.divide(limit(multiply_1.divide(N, T), X, A, sides), d));
            if (!find_1.Find(q, symbol_1.symbol(defs_1.INF)) || isInfinite(q)) {
                return q;
            }
        }
        catch (e) {
            // the next term
        }
    }
    return undefined;
}
// a product of powers c^g with constant bases c > 0 is exp(sum of g*log(c)):
// 2^x/3^x at inf, where L'Hopital only reproduces the quotient
function expProduct(F, X, A, sides) {
    if (!defs_1.ismultiply(F)) {
        return undefined;
    }
    const withX = F.tail().filter((f) => find_1.Find(f, X));
    const isExp = (f) => defs_1.ispower(f) &&
        !find_1.Find(defs_1.cadr(f), X) &&
        (defs_1.cadr(f) === symbol_1.symbol(defs_1.E) || assume_1.isPositive(defs_1.cadr(f)) === true);
    if (withX.length < 2 || !withX.every(isExp)) {
        return undefined;
    }
    try {
        const exponent = withX
            .map((f) => multiply_1.multiply(defs_1.caddr(f), log_1.logarithm(defs_1.cadr(f))))
            .reduce(add_1.add, defs_1.Constants.zero);
        const L = limit(condense_1.Condense(exponent), X, A, sides);
        const rest = multiply_1.multiply_all(F.tail().filter((f) => !find_1.Find(f, X)));
        if (!isInfinite(L)) {
            return multiply_1.multiply(rest, misc_1.exponential(L));
        }
        const r = L === symbol_1.symbol(defs_1.INF) ? signedInf(multiply_1.multiply(rest, L)) : defs_1.Constants.zero;
        return find_1.Find(r, symbol_1.symbol(defs_1.INF)) && !isInfinite(r) ? undefined : r;
    }
    catch (e) {
        return undefined;
    }
}
// F(K(x)) with x only inside one function K: the limit of F(y) at the
// limit of K. exp(-tan(x))*tan(x) left of pi/2 is y*exp(-y) at inf.
function viaKernel(F, X, A, sides) {
    const kernels = [];
    const collect = (p) => {
        if (!defs_1.iscons(p) || !find_1.Find(p, X)) {
            return;
        }
        if (p !== F && !defs_1.isadd(p) && !defs_1.ismultiply(p) && !defs_1.ispower(p)) {
            kernels.push(p);
        }
        p.tail().forEach(collect);
    };
    collect(F);
    const y = symbol_1.usr_symbol('limit_y');
    for (const K of kernels.slice(0, 3)) {
        const G = subst_1.subst(F, K, y);
        if (find_1.Find(G, X)) {
            continue;
        }
        try {
            return limit(eval_1.Eval(G), y, limit(K, X, A, sides));
        }
        catch (e) {
            // the next kernel
        }
    }
    return undefined;
}
// One round of L'Hopital at infinity with everything else behind it:
// log(2^x+3^x)/x becomes (2^x*log(2)+3^x*log(3))/(2^x+3^x), which L'Hopital
// only reproduces and leadingTerm resolves. Not nested.
let lhopitalOnceRunning = false;
function lhopitalOnce(F, X, A, sides) {
    if (lhopitalOnceRunning || !isInfinite(A) || hasJump(F, X)) {
        return undefined;
    }
    const sign = A === symbol_1.symbol(defs_1.INF) ? defs_1.Constants.one : defs_1.Constants.negOne;
    const N = numerator_1.numerator(F);
    const D = denominator_1.denominator(F);
    lhopitalOnceRunning = true;
    try {
        const both = (test) => [N, D].every((p) => {
            const v = assume_1.withSign(X, is_1.isnegativenumber(sign) ? 'negative' : 'positive', () => atInfinity(p, X, sign));
            return v !== undefined && test(v);
        });
        if (!both(isInfinite) && !both(is_1.isZeroAtomOrTensor)) {
            return undefined;
        }
        return limit(multiply_1.divide(derivative_1.derivative(N, X), derivative_1.derivative(D, X)), X, A, sides);
    }
    catch (e) {
        return undefined;
    }
    finally {
        lhopitalOnceRunning = false;
    }
}
// guards invert() against the way back: limitAtInfinity puts x = 1/t
let inverting = false;
// One side of a finite point as a limit at infinity, x = A +- 1/u: there
// the values 0 and inf of the parts are known (at the point they are only
// "division by zero"), and exp(-1/x)/x^3 becomes u^3/exp(u).
function invert(F, X, A, sides) {
    if (inverting || isInfinite(A) || sides.length !== 1) {
        return undefined;
    }
    inverting = true;
    try {
        return assume_1.withSign(X, 'positive', () => {
            const G = eval_1.Eval(subst_1.subst(F, X, add_1.add(A, multiply_1.divide(bignum_1.integer(sides[0]), X))));
            // log(x) left of 0 is not real
            if (find_1.Find(G, defs_1.Constants.imaginaryunit)) {
                return undefined;
            }
            return limit(G, X, symbol_1.symbol(defs_1.INF));
        });
    }
    catch (e) {
        return undefined;
    }
    finally {
        inverting = false;
    }
}
// the sum of the limits of the expanded terms, when each one exists
function termwise(F, X, A, sides) {
    const expanded = misc_1.yyexpand(F);
    if (!defs_1.isadd(expanded)) {
        return undefined;
    }
    try {
        const parts = expanded.tail().map((t) => limit(t, X, A, sides));
        const infinite = parts.filter(isInfinite);
        if (infinite.some((p) => !misc_1.equal(p, infinite[0]))) {
            return undefined; // inf - inf
        }
        return infinite.length > 0 ? infinite[0] : parts.reduce(add_1.add, defs_1.Constants.zero);
    }
    catch (e) {
        return undefined;
    }
}
// the product of the limits of the factors, when all are finite
function factorwise(F, X, A, sides) {
    if (!defs_1.ismultiply(F)) {
        return undefined;
    }
    try {
        const parts = F.tail().map((f) => (find_1.Find(f, X) ? limit(f, X, A, sides) : f));
        return parts.some((p) => find_1.Find(p, symbol_1.symbol(defs_1.INF))) ? undefined : multiply_1.multiply_all(parts);
    }
    catch (e) {
        return undefined;
    }
}
// f(g(x)) for a function f of one argument: f at the limit of g, itself
// taken as a limit so that log(0), arctan(inf) and the like are resolved
// The same for a power with X only in the base or only in the exponent.
function compose(F, X, A, sides) {
    if (!defs_1.iscons(F) || !defs_1.issymbol(defs_1.car(F))) {
        return undefined;
    }
    const args = F.tail();
    const withX = args.filter((a) => find_1.Find(a, X));
    if (withX.length !== 1 || (args.length !== 1 && !defs_1.ispower(F))) {
        return undefined;
    }
    try {
        const inner = limit(withX[0], X, A, sides);
        if (find_1.Find(inner, X) || misc_1.equal(inner, withX[0])) {
            return undefined;
        }
        const y = symbol_1.usr_symbol('limit_y');
        const outer = list_1.makeList(defs_1.car(F), ...args.map((a) => (a === withX[0] ? y : a)));
        return limitCore(outer, y, inner, [-1, 1]);
    }
    catch (e) {
        return undefined;
    }
}
function limitCore(F, X, A, sides) {
    if (A === symbol_1.symbol(defs_1.INF)) {
        return limitAtInfinity(F, X, defs_1.Constants.one);
    }
    if (misc_1.equal(A, multiply_1.negate(symbol_1.symbol(defs_1.INF)))) {
        return limitAtInfinity(F, X, defs_1.Constants.negOne);
    }
    return limitAt(F, X, A, sides);
}
// x -> +-inf becomes t -> 0 from the right with x = +-1/t (X is reused as t).
// Numerator and denominator are rationalized separately so the powers of t
// cancel; rationalizing the whole quotient leaves nested fractions behind.
// Near +inf, x is positive (near -inf negative), and t -> 0 from the right
// is positive: rules like log(1/t) = -log(t) need to know that.
function limitAtInfinity(F, X, sign) {
    const near = is_1.isnegativenumber(sign) ? 'negative' : 'positive';
    return assume_1.withSign(X, near, () => {
        const direct = atInfinity(F, X, sign);
        if (direct !== undefined) {
            return direct;
        }
        const lhopital = lhopitalAtInfinity(F, X, sign);
        if (lhopital !== undefined) {
            return lhopital;
        }
        return assume_1.withSign(X, 'positive', () => {
            const at = (p) => rationalize_1.rationalize(splitRadicals(eval_1.Eval(subst_1.subst(p, X, multiply_1.divide(sign, X))), X));
            const G = multiply_1.divide(at(numerator_1.numerator(F)), at(denominator_1.denominator(F)));
            return limitAt(G, X, defs_1.Constants.zero, [1]);
        });
    });
}
// (N/t^2)^(1/2) = N^(1/2)/t for t > 0: the radicand is put over one
// denominator, then the power splits over its positive factors
function splitRadicals(p, X) {
    if (!defs_1.iscons(p) || !find_1.Find(p, X)) {
        return p;
    }
    if (defs_1.ispower(p) && defs_1.isrational(defs_1.caddr(p)) && !is_1.isinteger(defs_1.caddr(p))) {
        // the denominator t^2 > 0 leaves the root whatever the sign of the
        // numerator: ((1-t^2)/t^2)^(1/2) = (1-t^2)^(1/2)/t
        const R = rationalize_1.rationalize(splitRadicals(defs_1.cadr(p), X));
        const d = denominator_1.denominator(R);
        return assume_1.isPositive(d) === true
            ? multiply_1.divide(power_1.power(numerator_1.numerator(R), defs_1.caddr(p)), power_1.power(d, defs_1.caddr(p)))
            : power_1.power(R, defs_1.caddr(p));
    }
    return eval_1.Eval(list_1.makeList(defs_1.car(p), ...p.tail().map((q) => splitRadicals(q, X))));
}
const isInfinite = (p) => p === symbol_1.symbol(defs_1.INF) || misc_1.equal(p, multiply_1.negate(symbol_1.symbol(defs_1.INF)));
// F at x = +-inf: substituted, with the functions that have a value at
// +-inf replaced by it. Returns undefined for an indeterminate form or when
// something of inf is left over (sin(inf) has no value).
function atInfinity(F, X, sign) {
    try {
        // not evaluated as a whole first: that would turn (1+1/inf)^inf into 1
        const v = resolveInf(subst_1.subst(F, X, multiply_1.multiply(sign, symbol_1.symbol(defs_1.INF))));
        // log(1/inf) = log(0): the evaluator does not know that it is -inf
        if (hasPole(v)) {
            return undefined;
        }
        if (!find_1.Find(v, symbol_1.symbol(defs_1.INF)) || isInfinite(v)) {
            return v;
        }
        // +-inf plus real terms without inf: in a limit the other symbols are
        // constants, so those terms are finite (log(a)+inf is inf for a > 0)
        if (defs_1.isadd(v)) {
            const infinite = v.tail().filter(isInfinite);
            const rest = v.tail().filter((t) => !isInfinite(t));
            if (infinite.length === 1 &&
                rest.every((t) => !find_1.Find(t, symbol_1.symbol(defs_1.INF)) && assume_1.isReal(t) === true)) {
                return infinite[0];
            }
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
        // inf^a for a of known sign
        if (arg === inf && !find_1.Find(exponent, inf)) {
            const e = assume_1.facts(exponent);
            if (e.positive || e.negative) {
                return e.positive ? inf : defs_1.Constants.zero;
            }
        }
        if (isInfinite(exponent)) {
            const base = arg === symbol_1.symbol(defs_1.E) ? bignum_1.double(Math.E) : float_1.zzfloat(arg);
            if (defs_1.isdouble(base) && base.d > 0) {
                return (base.d > 1) === (exponent === inf) ? inf : defs_1.Constants.zero;
            }
        }
    }
    // A jump function whose argument arrives at the jump: sgn(1/inf) is not
    // sgn(0) = 0, 1/x comes from above. limitAt decides it beside the point.
    if (isJumpFunction(head) && head !== symbol_1.symbol(defs_1.ABS) && find_1.Find(defs_1.cadr(p), inf) && !isInfinite(arg)) {
        const atJump = head === symbol_1.symbol(defs_1.MOD) ||
            (head === symbol_1.symbol(defs_1.SGN)
                ? is_1.isZeroAtomOrTensor(arg)
                : is_1.isinteger(head === symbol_1.symbol(defs_1.ROUND) ? add_1.add(arg, bignum_1.rational(1, 2)) : arg));
        if (atJump) {
            run_1.stop('limit: jump function at its jump');
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
        // Si(+-inf) = +-pi/2, the Fresnel integrals +-1/2, Ci(inf) = 0,
        // Ei(inf) = inf, Ei(-inf) = 0
        switch (defs_1.issymbol(head) ? head.printname : '') {
            case 'Si':
                return multiply_1.multiply(s, multiply_1.divide(defs_1.Constants.Pi(), bignum_1.integer(2)));
            case 'fresnels':
            case 'fresnelc':
                return multiply_1.multiply(s, bignum_1.rational(1, 2));
            case 'Ci':
                if (arg === inf) {
                    return defs_1.Constants.zero;
                }
                break;
            case 'Ei':
                return arg === inf ? inf : defs_1.Constants.zero;
        }
    }
    return signedInf(eval_1.Eval(list_1.makeList(head, ...args)));
}
// c*inf is inf or -inf when the sign of c is known (a*inf with a > 0,
// inf/a, pi*inf); otherwise it is left as it is
function signedInf(p) {
    if (!defs_1.ismultiply(p)) {
        return p;
    }
    const factors = p.tail();
    const rest = factors.filter((f) => f !== symbol_1.symbol(defs_1.INF));
    if (rest.length !== factors.length - 1 || rest.some((f) => find_1.Find(f, symbol_1.symbol(defs_1.INF)))) {
        return p;
    }
    const c = assume_1.facts(multiply_1.multiply_all(rest));
    return c.positive ? symbol_1.symbol(defs_1.INF) : c.negative ? multiply_1.negate(symbol_1.symbol(defs_1.INF)) : p;
}
// The exponential beats every power: x^10/exp(x) needs 10 rounds, each one
// lowers the degree of the polynomial part.
function lhopitalBudget(parts, X) {
    const deg = (p) => (is_1.ispolyexpandedform(p, X) ? bignum_1.nativeInt(degree_1.degree(p, X)) || 0 : 0);
    return Math.min(parts.map(deg).reduce((a, b) => a + b, MAX_LHOPITAL_ITERATIONS), 30);
}
// L'Hopital for 0/0 and inf/inf; undefined when it does not come to a
// result. A product 0*inf is tried with its zero factors, then with its
// infinite factors, as the denominator: x*exp(x) at -inf is x/exp(-x),
// x*(pi/2-arctan(x)) is (pi/2-arctan(x))/(1/x). `infinite` is asked for the
// result when the numerator alone is infinite or the denominator alone 0.
function lhopital(F, X, valueOf, infinite, steps) {
    if (hasJump(F, X)) {
        return undefined;
    }
    const splits = [[numerator_1.numerator(F), denominator_1.denominator(F)]];
    const P = defs_1.isadd(F) ? condense_1.Condense(F) : F;
    const factors = defs_1.ismultiply(P) ? P.tail() : [];
    // only the first round asks limit() for the value of a part: every round
    // of every split doing so would not end
    const top = steps === undefined;
    const values = factors.map((f) => valueOf(f, top));
    const going = (test) => factors.filter((f, i) => values[i] !== undefined && test(values[i]));
    const zero = going(is_1.isZeroAtomOrTensor);
    const infiniteFactors = going(isInfinite);
    if (zero.length > 0 && infiniteFactors.length > 0) {
        for (const part of [zero, infiniteFactors]) {
            const d = multiply_1.multiply_all(part);
            splits.push([multiply_1.divide(P, d), multiply_1.inverse(d)]);
        }
    }
    // derivatives in total, over all splits: each round has up to three
    if (steps === undefined) {
        steps = { left: lhopitalBudget([...splits[0], ...factors], X) };
    }
    for (const [N, D] of splits) {
        const n = valueOf(N, top && find_1.Find(D, X));
        const d = valueOf(D, top && find_1.Find(N, X));
        if (n === undefined || d === undefined) {
            continue;
        }
        const bothZero = is_1.isZeroAtomOrTensor(n) && is_1.isZeroAtomOrTensor(d);
        if (!bothZero && !(isInfinite(n) && isInfinite(d))) {
            if (isInfinite(d)) {
                return defs_1.Constants.zero;
            }
            const r = isInfinite(n) || is_1.isZeroAtomOrTensor(d) ? infinite(n, d, D) : multiply_1.divide(n, d);
            if (r !== undefined) {
                return r;
            }
            continue;
        }
        if (steps.left-- <= 0) {
            return undefined;
        }
        // the quotient of the derivatives is normalized before it is taken
        // apart again: 2*x/(x^2+1) / (1/x) is 2*x^2/(x^2+1); nested fractions
        // like 1/(x*(2*x/(x^3+x^2)+3*x^2/(x^3+x^2))) need more
        let G = multiply_1.divide(derivative_1.derivative(N, X), derivative_1.derivative(D, X));
        if ([numerator_1.numerator(G), denominator_1.denominator(G)].some((part) => valueOf(part, false) === undefined)) {
            G = multiply_1.divide(rationalize_1.rationalize(numerator_1.numerator(G)), rationalize_1.rationalize(denominator_1.denominator(G)));
        }
        const r = lhopital(G, X, valueOf, infinite, steps);
        if (r !== undefined) {
            return r;
        }
    }
    return undefined;
}
function lhopitalAtInfinity(F, X, sign) {
    const A = multiply_1.multiply(sign, symbol_1.symbol(defs_1.INF));
    const valueOf = (part, proper) => {
        const v = atInfinity(part, X, sign);
        return v !== undefined || !proper ? v : finiteOrInfinite(() => limit(part, X, A));
    };
    return lhopital(F, X, valueOf, (n, d, D) => {
        if (!is_1.isZeroAtomOrTensor(d)) {
            return signedInf(multiply_1.divide(n, d));
        }
        // n/0: the side from which D comes to 0 is known for exp(x) at -inf
        const side = assume_1.facts(D);
        if (is_1.isZeroAtomOrTensor(n) || !(side.positive || side.negative)) {
            return undefined;
        }
        const q = signedInf(multiply_1.multiply(side.positive ? n : multiply_1.negate(n), symbol_1.symbol(defs_1.INF)));
        return isInfinite(q) ? q : undefined;
    });
}
// The limit of a part of F for lhopital, or undefined for none and for
// something like inf/a. Not nested: a part of a part is only substituted,
// otherwise every round of every L'Hopital would start new ones.
let probing = false;
function finiteOrInfinite(f) {
    if (probing) {
        return undefined;
    }
    probing = true;
    try {
        const L = f();
        return find_1.Find(L, symbol_1.symbol(defs_1.INF)) && !isInfinite(L) ? undefined : L;
    }
    catch (e) {
        return undefined;
    }
    finally {
        probing = false;
    }
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
        // symbolic: the sign may be known from the assumptions (a/x, a > 0)
        const known = defs_1.isdouble(v) ? undefined : assume_1.facts(v);
        if ((known === null || known === void 0 ? void 0 : known.positive) || (known === null || known === void 0 ? void 0 : known.negative)) {
            return known.positive;
        }
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
function isRounding(head) {
    return [defs_1.FLOOR, defs_1.CEILING, defs_1.ROUND].some((f) => head === symbol_1.symbol(f));
}
function isJumpFunction(head) {
    return isRounding(head) || [defs_1.SGN, defs_1.ABS, defs_1.MOD].some((f) => head === symbol_1.symbol(f));
}
// a jump function of X (abs(a) is a constant)
function hasJump(p, X) {
    return (defs_1.iscons(p) &&
        find_1.Find(p, X) &&
        (isJumpFunction(defs_1.car(p)) || piecewise_1.isPiecewise(p) || p.tail().some((q) => hasJump(q, X))));
}
// floor(g), ceiling(g) and round(g) with g -> +-inf are g plus a bounded
// part, the fractional part mod(g,1): floor(g) = g - mod(g,1). Then
// floor(x)/x is 1 - mod(x,1)/x, and the squeeze argument applies. The
// exponent of (-1)^floor(x) stays as it is, see oscillating.
function unboundFloors(F, X, A, sides) {
    if (![defs_1.FLOOR, defs_1.CEILING, defs_1.ROUND].some((f) => find_1.Find(F, symbol_1.symbol(f)))) {
        return F;
    }
    const toInfinity = (g) => {
        try {
            return (isInfinite(A) ? [1] : sides).every((s) => isInfinite(limit(g, X, A, [s])));
        }
        catch (e) {
            return false;
        }
    };
    const frac = (g) => list_1.makeList(symbol_1.symbol(defs_1.MOD), g, defs_1.Constants.one);
    const half = bignum_1.rational(1, 2);
    const walk = (p) => {
        if (!defs_1.iscons(p) || !find_1.Find(p, X) || (defs_1.ispower(p) && is_1.isnegativenumber(defs_1.cadr(p)))) {
            return p;
        }
        const head = defs_1.car(p);
        if (isRounding(head) && toInfinity(defs_1.cadr(p))) {
            const g = walk(defs_1.cadr(p));
            return head === symbol_1.symbol(defs_1.FLOOR)
                ? add_1.subtract(g, frac(g))
                : head === symbol_1.symbol(defs_1.CEILING)
                    ? add_1.add(g, frac(multiply_1.negate(g)))
                    : add_1.subtract(add_1.add(g, half), frac(add_1.add(g, half)));
        }
        return list_1.makeList(head, ...p.tail().map(walk));
    };
    const G = walk(F);
    return misc_1.equal(G, F) ? F : eval_1.Eval(G);
}
// tan, gamma and digamma stop at their poles like 1/0, and L'Hopital has
// nothing to work with. With a pole at the point they are rewritten with
// the pole in a plain denominator: tan = sin/cos, at g = -n
// Gamma(g) = Gamma(g+n+2)/(g*(g+1)*...*(g+n+1)) (the evaluator turns
// Gamma(x+1) into x*Gamma(x) again, Gamma(x+2) it leaves alone) and
// digamma(g) = digamma(g+n+1) - 1/g - ... - 1/(g+n).
function regularizePoles(F, X, A) {
    const digamma = symbol_1.usr_symbol('digamma');
    if (![symbol_1.symbol(defs_1.TAN), symbol_1.symbol(defs_1.GAMMA), digamma].some((f) => find_1.Find(F, f))) {
        return F;
    }
    const walk = (p) => {
        if (!defs_1.iscons(p) || !find_1.Find(p, X)) {
            return p;
        }
        const head = defs_1.car(p);
        const args = p.tail().map(walk);
        const g = args[0];
        const at = args.length === 1 ? tryEvalAt(g, X, A) : INDETERMINATE;
        if (at !== INDETERMINATE) {
            if (head === symbol_1.symbol(defs_1.TAN) && is_1.isZeroAtomOrTensor(cos_1.cosine(at))) {
                return multiply_1.divide(sin_1.sine(g), cos_1.cosine(g));
            }
            const n = is_1.isinteger(at) && !is_1.isposint(at) ? -bignum_1.nativeInt(at) : NaN;
            const shifted = (k) => eval_1.Eval(list_1.makeList(head, add_1.add(g, bignum_1.integer(k))));
            const steps = (count) => [...Array(count).keys()].map((k) => add_1.add(g, bignum_1.integer(k)));
            if (head === symbol_1.symbol(defs_1.GAMMA) && n <= 20) {
                return multiply_1.divide(shifted(n + 2), multiply_1.multiply_all(steps(n + 2)));
            }
            if (head === digamma && n <= 20) {
                return steps(n + 1).map(multiply_1.inverse).reduce(add_1.subtract, shifted(n + 1));
            }
        }
        return list_1.makeList(head, ...args);
    };
    const G = walk(F);
    return misc_1.equal(G, F) ? F : eval_1.Eval(G);
}
// sin or cos of something that goes to infinity, anywhere inside
function hasWave(p, X, A, side) {
    if (!defs_1.iscons(p) || !find_1.Find(p, X)) {
        return false;
    }
    if (defs_1.car(p) === symbol_1.symbol(defs_1.SIN) || defs_1.car(p) === symbol_1.symbol(defs_1.COS)) {
        try {
            if (isInfinite(limit(defs_1.cadr(p), X, A, [side]))) {
                return true;
            }
        }
        catch (e) {
            return true;
        }
    }
    return p.tail().some((q) => hasWave(q, X, A, side));
}
// The value of g at one point beside A decides a jump function of g only
// if g settles there: it has a limit on that side (sgn(sin(x)) at inf has
// none), a finite one for floor, ceiling and round (floor(x) at inf is not
// the constant floor(1000000)), and where the limit is a jump of the
// function itself, g must come from one side (sgn(x*sin(1/x)) does not).
// mod is never decided: the evaluator's mod is the one of integers.
function probeHolds(head, g, X, A, side) {
    let L;
    try {
        L = limit(g, X, A, [side]);
    }
    catch (e) {
        return false;
    }
    if (head === symbol_1.symbol(defs_1.MOD)) {
        return false;
    }
    const signOnly = head === symbol_1.symbol(defs_1.SGN) || head === symbol_1.symbol(defs_1.ABS);
    if (find_1.Find(L, symbol_1.symbol(defs_1.INF))) {
        return signOnly && isInfinite(L);
    }
    const atJump = signOnly
        ? is_1.isZeroAtomOrTensor(L)
        : is_1.isinteger(head === symbol_1.symbol(defs_1.ROUND) ? add_1.add(L, bignum_1.rational(1, 2)) : L);
    return !atJump || !hasWave(g, X, A, side);
}
// On one side of the point a jump function is smooth: sgn(g) is a constant,
// abs(g) is g or -g, floor(g), ceiling(g) and round(g) are constants. The
// value of g just beside the point says which, see probeHolds. Nodes whose g
// cannot be evaluated numerically there (symbolic coefficients) are left as
// they are.
function resolveJumps(p, X, A, side, beside) {
    if (!defs_1.iscons(p) || !find_1.Find(p, X)) {
        return p;
    }
    const head = defs_1.car(p);
    if (piecewise_1.isPiecewise(p)) {
        const branch = piecewise_1.activeBranch(p, X, bignum_1.double(beside));
        if (branch !== undefined) {
            return resolveJumps(branch, X, A, side, beside);
        }
    }
    if (isJumpFunction(head)) {
        const g = defs_1.cadr(p);
        let v;
        try {
            v = float_1.zzfloat(subst_1.subst(g, X, bignum_1.double(beside)));
        }
        catch (e) {
            v = g;
        }
        if (defs_1.isdouble(v) && probeHolds(head, g, X, A, side)) {
            const inner = resolveJumps(g, X, A, side, beside);
            switch (head) {
                case symbol_1.symbol(defs_1.SGN):
                    return bignum_1.integer(Math.sign(v.d));
                case symbol_1.symbol(defs_1.ABS):
                    return v.d < 0 ? multiply_1.negate(inner) : inner;
                case symbol_1.symbol(defs_1.FLOOR):
                    return bignum_1.integer(Math.floor(v.d));
                case symbol_1.symbol(defs_1.ROUND):
                    return bignum_1.integer(Math.round(v.d));
                default:
                    return bignum_1.integer(Math.ceil(v.d));
            }
        }
    }
    return list_1.makeList(head, ...p.tail().map((q) => resolveJumps(q, X, A, side, beside)));
}
// With jump functions present the value at the point says nothing about the
// limit, and L'Hopital does not apply. Each side is solved on its own, with
// the jumps resolved for that side, and the sides must agree. Returns
// undefined for a symbolic point; jumps that could not be resolved stop.
function limitWithJumps(F, X, A, sides) {
    const a = float_1.zzfloat(A);
    if (!defs_1.isdouble(a)) {
        return undefined;
    }
    const eps = 1e-6 * Math.max(1, Math.abs(a.d));
    const results = [];
    for (const side of sides) {
        const smooth = eval_1.Eval(resolveJumps(F, X, A, side, a.d + side * eps));
        if (hasJump(smooth, X)) {
            run_1.stop('limit: could not resolve a jump function');
        }
        results.push(limit(smooth, X, A, [side]));
    }
    if (results.some((r) => !misc_1.equal(r, results[0]))) {
        run_1.stop('limit: left and right limits differ — limit does not exist');
    }
    return results[0];
}
// sides: -1 for the left of A, 1 for the right
function limitAt(F, X, A, sides) {
    F = regularizePoles(F, X, A);
    if (hasJump(F, X)) {
        const resolved = limitWithJumps(F, X, A, sides);
        if (resolved !== undefined) {
            return resolved;
        }
    }
    let result = tryEvalAt(F, X, A);
    if (result !== INDETERMINATE) {
        if (!hasPole(result)) {
            return result;
        }
        if (isInfiniteAtPole(result)) {
            return infiniteLimit(F, X, A, sides);
        }
        // sin(log(0)), arctan(log(0)), 1/log(0): the fallbacks of limit() go on
        run_1.stop('limit: could not resolve a pole inside a function');
    }
    const simplified = simplify_1.simplify(F);
    result = tryEvalAt(simplified, X, A);
    if (result !== INDETERMINATE && !hasPole(result)) {
        return result;
    }
    // A part that cannot be substituted may still have a limit of its own:
    // log(sin(x)/x) in log(sin(x)/x)/x^2. log(0) counts as an infinity, of
    // unknown sign: log(0)/log(0) is inf/inf, not 1.
    const valueOf = (part, proper) => {
        const v = tryEvalAt(part, X, A);
        if (v !== INDETERMINATE) {
            return !hasPole(v) ? v : isInfiniteAtPole(v) ? symbol_1.symbol(defs_1.INF) : undefined;
        }
        return proper ? finiteOrInfinite(() => limit(part, X, A, sides)) : undefined;
    };
    // no L'Hopital through a jump function (at a symbolic point): lhopital
    const viaLhopital = lhopital(F, X, valueOf, () => infiniteLimit(F, X, A, sides));
    if (viaLhopital !== undefined) {
        return viaLhopital;
    }
    run_1.stop("limit: could not resolve after repeated L'Hopital iterations");
}
