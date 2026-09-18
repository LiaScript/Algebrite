"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_defint = void 0;
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const assume_1 = require("./assume");
const derivative_1 = require("./derivative");
const eval_1 = require("./eval");
const float_1 = require("./float");
const imag_1 = require("./imag");
const integral_1 = require("./integral");
const is_1 = require("./is");
const limit_1 = require("./limit");
const bignum_1 = require("./bignum");
const list_1 = require("./list");
const piecewise_1 = require("./piecewise");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const real_1 = require("./real");
const simplify_1 = require("./simplify");
const subst_1 = require("./subst");
/* defint =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
f,x,a,b[,y,c,d...]

General description
-------------------
Returns the definite integral of f with respect to x evaluated from "a" to b.
The argument list can be extended for multiple integrals (or "iterated
integrals"), for example a double integral (which can represent for
example a volume under a surface), or a triple integral, etc. For
example, defint(f,x,a,b,y,c,d).

*/
function Eval_defint(p1) {
    return float_1.evalExactly(evalDefint, p1);
}
exports.Eval_defint = Eval_defint;
function evalDefint(p1) {
    const n = misc_1.length(p1) - 1;
    if (n < 4 || (n - 1) % 3 !== 0) {
        run_1.stop(`defint: expected f,x,a,b[,y,c,d...], got ${n} arguments`);
    }
    let F = eval_1.Eval(defs_1.cadr(p1));
    p1 = defs_1.cddr(p1);
    // defint can handle multiple
    // integrals, so we loop over the
    // multiple integrals here
    while (defs_1.iscons(p1)) {
        const X = eval_1.Eval(defs_1.car(p1));
        p1 = defs_1.cdr(p1);
        const A = eval_1.Eval(defs_1.car(p1));
        p1 = defs_1.cdr(p1);
        const B = eval_1.Eval(defs_1.car(p1));
        p1 = defs_1.cdr(p1);
        F = definite(F, X, A, B);
    }
    return F;
}
// the integral of F from A to B with respect to X
function definite(F, X, A, B) {
    // constant factors stay outside: integral() gives a/(2+cos(x)) as a
    // complex log, whose branch cut neither limit() nor the jumps below see
    const factors = defs_1.ismultiply(F) ? F.tail() : [];
    const constants = factors.filter((q) => !find_1.Find(q, X));
    if (constants.length > 0) {
        const rest = multiply_1.multiply_all(factors.filter((q) => find_1.Find(q, X)));
        // in float mode the rest has its factor 1.0 back: no progress
        if (!defs_1.ismultiply(rest) || rest.tail().every((q) => find_1.Find(q, X))) {
            const inner = definite(rest, X, A, B);
            return defs_1.car(inner) === symbol_1.symbol(defs_1.DEFINT)
                ? list_1.makeList(symbol_1.symbol(defs_1.DEFINT), F, X, A, B)
                : multiply_1.multiply(multiply_1.multiply_all(constants), inner);
        }
    }
    // piecewise: split at the break points when the bounds are numbers,
    // otherwise through the continuous antiderivative; unevaluated when
    // neither is possible
    const unevaluated = list_1.makeList(symbol_1.symbol(defs_1.DEFINT), F, X, A, B);
    let antiderivative;
    if (piecewise_1.hasPiecewise(F)) {
        const [a, b] = [toNumber(A), toNumber(B)];
        if (!isNaN(a) && !isNaN(b)) {
            const pieces = (G, from, to) => definite(G, X, from, to);
            return piecewise_1.piecewiseDefint(F, X, [A, a], [B, b], pieces) || unevaluated;
        }
        antiderivative = integral_1.integral(F, X);
        if (find_1.Find(antiderivative, symbol_1.symbol(defs_1.INTEGRAL))) {
            return unevaluated;
        }
    }
    // an integrand with a pole inside the interval is an improper
    // integral; the antiderivative evaluated at the bounds would be wrong
    // (-2 for 1/x^2 from -1 to 1, which diverges)
    checkNoInteriorPole(F, X, A, B);
    // obtain the primitive of F against the
    // specified variable X
    // note that the primitive changes over
    // the calculation of the multiple
    // integrals.
    const integrand = F;
    F = antiderivative || integral_1.integral(F, X); // contains the antiderivative of F
    // the primitive at the bounds, approached from inside the interval:
    // limit() substitutes where it can, and resolves +-inf and endpoint
    // singularities (log(0), 1/0) with a one-sided limit
    const dir = Math.sign(toNumber(B) - toNumber(A)) || 0;
    const sides = (side) => (dir ? [side * dir] : [-1, 1]);
    const arg1 = limit_1.limit(F, X, B, sides(-1));
    const arg2 = limit_1.limit(F, X, A, sides(1));
    // integral between B and A is the
    // subtraction. Note that this could
    // be a number but also a function.
    // and we might have to integrate this
    // number/function again doing the while
    // loop again if this is a multiple
    // integral.
    // F(B)-F(A) needs a continuous F: the jumps of F inside are added
    const jumps = crossesBranchCut(F, X, A, B) ? undefined : interiorJumps(integrand, F, X, A, B);
    if (jumps === undefined) {
        return unevaluated;
    }
    return add_1.add(add_1.subtract(arg1, arg2), dir < 0 ? multiply_1.negate(jumps) : jumps);
}
// The antiderivatives of rational functions of sin, cos and tan are written
// with tan(x/2) or tan(x) and jump where that tan is singular, although the
// integrand is finite there: arctan(tan(x/2)/sqrt(3)) for 1/(2+cos(x)) at
// pi. Returns the sum of F(r-)-F(r+) over the singular points r of F
// strictly between the numeric bounds, as one-sided limits; stops when the
// integrand has a pole at r (F = tan(x/2) for 1/(1+cos(x))), and returns
// undefined when a jump cannot be given exactly.
function interiorJumps(f, F, X, a, b) {
    const [lo, hi] = [toNumber(a), toNumber(b)].sort((u, v) => u - v);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
        return defs_1.Constants.zero; // also NaN: symbolic bounds stay as they were
    }
    const { inside, points } = collector(lo, hi);
    poleIn(F, X, inside);
    points.sort((u, v) => u.r - v.r);
    // every jump costs two limits, unless they are all the same one; beyond
    // the cap unevaluated
    const same = equalJumps(F, X, points);
    if (inside.tooMany || (!same && points.length > MAX_JUMPS)) {
        return undefined;
    }
    let first;
    let total = defs_1.Constants.zero;
    for (const { r, exact } of points) {
        // with other symbols in f there are no numbers to look at; the limits
        // of an F without logs below still see a pole
        const removable = isRemovable(f, X, r);
        if (removable === false) {
            run_1.stop(poleMessage(X, r));
        }
        // 1/(b+cos(x)): the logs of F stand for an arctan with a jump when
        // abs(b) > 1 and have poles otherwise, the limits cannot know
        if (removable === undefined && hasLogOf(F, X)) {
            return undefined;
        }
        if (exact === undefined) {
            // ponytail: a singular point known only as a float (a root from
            // nroots): ignored when F is continuous there, else no result
            if (jumpsAt(F, X, r)) {
                return undefined;
            }
            continue;
        }
        let jump = same ? first : undefined;
        if (jump === undefined) {
            try {
                const at = exact();
                jump = add_1.subtract(limit_1.limit(F, X, at, [-1]), limit_1.limit(F, X, at, [1]));
            }
            catch (e) {
                return undefined;
            }
            if (find_1.Find(jump, symbol_1.symbol(defs_1.INF))) {
                run_1.stop(poleMessage(X, r)); // F is infinite there, so is its derivative
            }
            first = jump;
        }
        total = add_1.add(total, jump);
    }
    return total;
}
const MAX_JUMPS = 100; // limits taken one by one
const MAX_POINTS = 2000; // singular points of one sin, cos or tan looked at
// True when F(r-)-F(r+) is provably the same at all points: they are P
// apart, and F is c*x plus a function of tan(u) alone, each u linear in x
// with the period P or a fraction of it. Then F(x+P) = F(x)+c*P beside
// every point. (tan(u) becomes a symbol; what is left must have a constant
// derivative.)
function equalJumps(F, X, points) {
    if (points.length < 3 || points.some((q) => q.exact === undefined)) {
        return false;
    }
    const P = points[1].r - points[0].r;
    if (points.some((q, i) => i > 0 && Math.abs(q.r - points[i - 1].r - P) > 1e-9 * Math.abs(P))) {
        return false;
    }
    let periodic = true;
    let count = 0;
    const tans = [];
    const withoutTan = (p) => {
        if (!defs_1.iscons(p)) {
            return p;
        }
        if (defs_1.car(p) === symbol_1.symbol(defs_1.TAN)) {
            const periods = numericAt(derivative_1.derivative(defs_1.cadr(p), X), X, 0) * P / Math.PI;
            periodic = periodic && Math.abs(periods - Math.round(periods)) < 1e-9 && Math.round(periods) !== 0;
            tans.push(symbol_1.usr_symbol(`defint_tan${count++}`));
            return tans[tans.length - 1];
        }
        return list_1.makeList(...[...p].map(withoutTan));
    };
    const slope = derivative_1.derivative(eval_1.Eval(withoutTan(F)), X);
    return periodic && !find_1.Find(slope, X) && !tans.some((t) => find_1.Find(slope, t));
}
function hasLogOf(p, X) {
    return defs_1.iscons(p) && ((defs_1.car(p) === symbol_1.symbol(defs_1.LOG) && find_1.Find(p, X)) || p.tail().some((q) => hasLogOf(q, X)));
}
// A log of a complex argument in F jumps by 2*pi*i where the argument
// crosses the negative real axis; integral() writes such logs when a
// symbolic term keeps it from the real arctan form. True when that happens
// between the numeric bounds or at one of them (samples).
function crossesBranchCut(F, X, a, b) {
    const [lo, hi] = [toNumber(a), toNumber(b)];
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || !defs_1.iscons(F)) {
        return false;
    }
    if (defs_1.car(F) !== symbol_1.symbol(defs_1.LOG) || !find_1.Find(F, X) || !find_1.Find(F, defs_1.Constants.imaginaryunit)) {
        return F.tail().some((q) => crossesBranchCut(q, X, a, b));
    }
    const SAMPLES = 100;
    let [prevRe, prevIm] = [NaN, NaN];
    for (let i = 0; i <= SAMPLES; i++) {
        let re = NaN;
        let im = NaN;
        try {
            const v = float_1.zzfloat(eval_1.Eval(subst_1.subst(defs_1.cadr(F), X, bignum_1.double(lo + ((hi - lo) * i) / SAMPLES))));
            const [x, y] = [float_1.zzfloat(real_1.real(v)), float_1.zzfloat(imag_1.imag(v))];
            [re, im] = [defs_1.isdouble(x) ? x.d : NaN, defs_1.isdouble(y) ? y.d : NaN];
        }
        catch (e) {
            // no value here
        }
        const onCut = re < 0 && Math.abs(im) < 1e-9 * Math.abs(re);
        if (onCut || (prevIm * im < 0 && (re < 0 || prevRe < 0))) {
            return true;
        }
        [prevRe, prevIm] = [re, im];
    }
    return false;
}
function poleMessage(X, r) {
    return `defint: the integrand has a pole at ${X} = ${Number(r.toPrecision(6))} inside the interval`;
}
// the value of p at X = x as a JS number, NaN when it has none
function numericAt(p, X, x) {
    try {
        const v = float_1.zzfloat(eval_1.Eval(subst_1.subst(p, X, bignum_1.double(x))));
        return defs_1.isdouble(v) ? v.d : NaN;
    }
    catch (e) {
        return NaN;
    }
}
function jumpsAt(F, X, r) {
    const eps = 1e-7 * Math.max(1, Math.abs(r));
    const gap = numericAt(F, X, r + eps) - numericAt(F, X, r - eps);
    return !(Math.abs(gap) < 1e-4);
}
// An Inside that takes every zero strictly inside (lo,hi) down in points
// (in no order) and lets poleIn search on.
function collector(lo, hi) {
    const points = [];
    const inside = (r, exact) => {
        // a zero known exactly is inside unless it is the bound itself (a jump
        // 10^(-5) inside counts); a numeric root may be the bound with an error
        const tol = (exact ? 1e-9 : 1e-4) * Math.max(1, Math.abs(r));
        if (r > lo + tol && r < hi - tol && !points.some((q) => Math.abs(q.r - r) < tol)) {
            points.push({ r, exact });
        }
    };
    if (Number.isFinite(lo) && Number.isFinite(hi)) {
        inside.range = [lo, hi];
    }
    return { inside, points };
}
// a bound as a JS number: +-Infinity for +-inf, NaN when not numeric
function toNumber(p) {
    if (p === symbol_1.symbol(defs_1.INF)) {
        return Infinity;
    }
    if (misc_1.equal(p, multiply_1.negate(symbol_1.symbol(defs_1.INF)))) {
        return -Infinity;
    }
    const d = float_1.zzfloat(p);
    return defs_1.isdouble(d) ? d.d : NaN;
}
// Stops if f has a pole strictly between the numeric bounds a and b: a
// negative power (<= -1) of something with a real zero there (see zerosIn),
// or tan of a linear argument. A candidate is confirmed on the simplified
// integrand, (x^2-1)/(x-1) has no pole, and by the growth of f beside it.
// ponytail: numeric roots closer than ~1e-4 to a bound are taken as endpoint poles
function checkNoInteriorPole(f, X, a, b) {
    const [[lo, loU], [hi, hiU]] = [[toNumber(a), a], [toNumber(b), b]].sort((u, v) => u[0] - v[0]);
    if (isNaN(lo) || isNaN(hi)) {
        return;
    }
    // a symbolic pole, e.g. x = a with a > 0 in (0,inf): only when the
    // assumptions say it is strictly inside
    const symbolic = (r) => (lo === -Infinity || assume_1.isPositive(add_1.subtract(r, loU)) === true) &&
        (hi === Infinity || assume_1.isPositive(add_1.subtract(hiU, r)) === true);
    // numeric candidates: all of them, the first one may be removable while
    // a later one is a pole (1/(1+tan(x)): pi/2 is harmless, 3*pi/4 is not)
    const found = collector(lo, hi);
    found.inside.symbolic = symbolic;
    const symbolicPole = poleIn(f, X, found.inside);
    if (symbolicPole === undefined && found.points.length === 0) {
        return;
    }
    const confirmed = collector(lo, hi);
    confirmed.inside.symbolic = symbolic;
    if (poleIn(simplify_1.simplify(f), X, confirmed.inside) !== undefined && symbolicPole !== undefined) {
        run_1.stop(`defint: the integrand has a pole at ${X} = ${symbolicPole} inside the interval`);
    }
    found.points.sort((u, v) => u.r - v.r);
    const pole = found.points.find((c) => confirmed.points.some((q) => Math.abs(q.r - c.r) < 1e-6 * Math.max(1, Math.abs(c.r))) &&
        !isRemovable(f, X, c.r) // undefined: a/(x-1), a pole unless a = 0
    );
    if (pole !== undefined) {
        run_1.stop(poleMessage(X, pole.r));
    }
}
// sin(x)/x at 0: the denominator vanishes but f stays bounded. Near a pole
// abs(f) grows about tenfold when the distance shrinks tenfold, at a
// removable singularity it does not.
// undefined when f has no numeric values there (other symbols).
function isRemovable(f, X, r) {
    const absf = list_1.makeList(symbol_1.symbol(defs_1.ABS), f); // f may be complex beside r
    const eps = 1e-4 * Math.max(1, Math.abs(r));
    const values = [-1, 1].map((side) => [eps, eps / 100].map((d) => numericAt(absf, X, r + side * d)));
    if (values.every((v) => v.every(Number.isNaN))) {
        return undefined;
    }
    return values.every(([far, near]) => Number.isFinite(far) && Number.isFinite(near) && near < 2 * far + 1e-9);
}
function poleIn(p, X, inside) {
    if (!defs_1.iscons(p) || !find_1.Find(p, X)) {
        return undefined;
    }
    const head = defs_1.car(p);
    if (head === symbol_1.symbol(defs_1.POWER)) {
        const k = float_1.zzfloat(defs_1.caddr(p));
        if (defs_1.isdouble(k) && k.d <= -1) {
            const r = zerosIn(defs_1.cadr(p), X, inside);
            if (r !== undefined) {
                return r;
            }
        }
    }
    if (head === symbol_1.symbol(defs_1.TAN)) {
        const r = zerosIn(list_1.makeList(symbol_1.symbol(defs_1.COS), defs_1.cadr(p)), X, inside);
        if (r !== undefined) {
            return r;
        }
    }
    for (const q of p.tail()) {
        const r = poleIn(q, X, inside);
        if (r !== undefined) {
            return r;
        }
    }
    return undefined;
}
// Reports the real zeros of g to inside: of sin(linear) or cos(linear)
// exactly, of a polynomial through nroots, of anything else (1+2*cos(x),
// exp(x)-2) by a scan of the finite interval. Returns a symbolic zero
// inside as text.
function zerosIn(g, X, inside) {
    const head = defs_1.car(g);
    if (head === symbol_1.symbol(defs_1.SIN) || head === symbol_1.symbol(defs_1.COS)) {
        // u = alpha*x + beta = k*pi (sin) or pi/2 + k*pi (cos)
        const u = defs_1.cadr(g);
        const alphaU = derivative_1.derivative(u, X);
        const betaU = subst_1.subst(u, X, defs_1.Constants.zero);
        const alpha = float_1.zzfloat(alphaU);
        const beta = float_1.zzfloat(betaU);
        if (defs_1.isdouble(alpha) && defs_1.isdouble(beta) && alpha.d !== 0) {
            const isCos = head === symbol_1.symbol(defs_1.COS);
            const offset = isCos ? Math.PI / 2 : 0;
            // ponytail: without a finite interval the zeros for |k| <= 1000
            const ends = (inside.range || []).map((x) => (alpha.d * x + beta.d - offset) / Math.PI);
            const from = ends.length ? Math.floor(Math.min(...ends)) : -1000;
            let to = ends.length ? Math.ceil(Math.max(...ends)) : 1000;
            if (to - from > MAX_POINTS) {
                // poles are still found among the first ones; jumps are not added up
                inside.tooMany = true;
                to = from + MAX_POINTS;
            }
            for (let k = from; k <= to; k++) {
                const kPi = multiply_1.multiply(bignum_1.rational(isCos ? 2 * k + 1 : k, isCos ? 2 : 1), symbol_1.symbol(defs_1.PI));
                inside((offset + k * Math.PI - beta.d) / alpha.d, () => multiply_1.divide(add_1.subtract(kPi, betaU), alphaU));
            }
            return undefined;
        }
    }
    if (!is_1.ispolyfactoredorexpandedform(g, X)) {
        scanZeros(g, X, inside);
        return undefined;
    }
    let roots;
    try {
        roots = eval_1.Eval(list_1.makeList(symbol_1.symbol(defs_1.NROOTS), g, X));
    }
    catch (e) {
        return symbolicLinearZeroIn(g, X, inside); // symbolic coefficients
    }
    for (const z of defs_1.istensor(roots) ? roots.elem : [roots]) {
        const re = float_1.zzfloat(real_1.real(z));
        const im = float_1.zzfloat(imag_1.imag(z));
        if (defs_1.isdouble(re) && defs_1.isdouble(im) && Math.abs(im.d) < 1e-4 * Math.max(1, Math.abs(re.d))) {
            inside(re.d);
        }
    }
    return undefined;
}
// The zeros of g in the finite interval of inside, numerically: a change
// of sign between two samples is bisected, a local minimum of abs(g)
// without one (1-sin(x) at pi/2) is narrowed down; both count when g
// vanishes there, a change of sign through a pole of g does not.
// ponytail: fixed number of samples, two zeros between neighbouring samples
// are missed; sample adaptively if that ever matters
function scanZeros(g, X, inside) {
    if (!inside.range) {
        return;
    }
    const [lo, hi] = inside.range;
    const at = (x) => numericAt(g, X, x);
    if (Number.isNaN(at((lo + hi) / 2)) && Number.isNaN(at(lo + (hi - lo) / Math.E))) {
        return; // symbolic coefficients
    }
    const SAMPLES = 400;
    const xs = [];
    const ys = [];
    for (let i = 0; i <= SAMPLES; i++) {
        xs.push(lo + ((hi - lo) * i) / SAMPLES);
        ys.push(at(xs[i]));
    }
    const narrow = (a, b, leftIsNext) => {
        for (let i = 0; i < 60; i++) {
            const [p, q] = [a + (b - a) / 3, b - (b - a) / 3];
            if (leftIsNext(p, q)) {
                b = q;
            }
            else {
                a = p;
            }
        }
        return (a + b) / 2;
    };
    for (let i = 1; i <= SAMPLES; i++) {
        let r;
        if (ys[i] === 0) {
            r = xs[i];
        }
        else if (ys[i - 1] * ys[i] < 0) {
            const sign = Math.sign(ys[i - 1]);
            r = narrow(xs[i - 1], xs[i], (p) => Math.sign(at(p)) !== sign);
        }
        else if (i < SAMPLES &&
            Math.abs(ys[i]) < Math.abs(ys[i - 1]) &&
            Math.abs(ys[i]) <= Math.abs(ys[i + 1]) &&
            ys[i - 1] * ys[i + 1] > 0) {
            r = narrow(xs[i - 1], xs[i + 1], (p, q) => Math.abs(at(p)) < Math.abs(at(q)));
        }
        if (r !== undefined && Math.abs(at(r)) < 1e-9) {
            inside(r);
        }
    }
}
// the zero of alpha*x + beta with symbolic alpha != 0 and beta, as text
function symbolicLinearZeroIn(g, X, inside) {
    var _a;
    const alpha = derivative_1.derivative(g, X);
    if (find_1.Find(alpha, X) || assume_1.isNonzero(alpha) !== true) {
        return undefined;
    }
    const r = multiply_1.negate(multiply_1.divide(subst_1.subst(g, X, defs_1.Constants.zero), alpha));
    return ((_a = inside.symbolic) === null || _a === void 0 ? void 0 : _a.call(inside, r)) ? `${r}` : undefined;
}
