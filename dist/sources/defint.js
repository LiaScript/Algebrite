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
const list_1 = require("./list");
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
        // an integrand with a pole inside the interval is an improper
        // integral; the antiderivative evaluated at the bounds would be wrong
        // (-2 for 1/x^2 from -1 to 1, which diverges)
        checkNoInteriorPole(F, X, A, B);
        // obtain the primitive of F against the
        // specified variable X
        // note that the primitive changes over
        // the calculation of the multiple
        // integrals.
        F = integral_1.integral(F, X); // contains the antiderivative of F
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
        F = add_1.subtract(arg1, arg2);
    }
    return F;
}
exports.Eval_defint = Eval_defint;
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
// negative power (<= -1) of a polynomial with a real root there (nroots),
// or of sin/cos of a linear argument, or tan of one. A candidate is
// confirmed on the simplified integrand, (x^2-1)/(x-1) has no pole.
// ponytail: poles closer than ~1e-4 to a bound are taken as endpoint poles
function checkNoInteriorPole(f, X, a, b) {
    const [[lo, loU], [hi, hiU]] = [[toNumber(a), a], [toNumber(b), b]].sort((u, v) => u[0] - v[0]);
    if (isNaN(lo) || isNaN(hi)) {
        return;
    }
    const inside = (r) => {
        const tol = 1e-4 * Math.max(1, Math.abs(r));
        return r > lo + tol && r < hi - tol;
    };
    // a symbolic pole, e.g. x = a with a > 0 in (0,inf): only when the
    // assumptions say it is strictly inside
    inside.symbolic = (r) => (lo === -Infinity || assume_1.isPositive(add_1.subtract(r, loU)) === true) &&
        (hi === Infinity || assume_1.isPositive(add_1.subtract(hiU, r)) === true);
    const pole = poleIn(f, X, inside);
    if (pole !== undefined && poleIn(simplify_1.simplify(f), X, inside) !== undefined) {
        run_1.stop(`defint: the integrand has a pole at ${X} = ${pole} inside the interval`);
    }
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
// a zero of the polynomial, sin(linear) or cos(linear) g inside, as text
function zerosIn(g, X, inside) {
    const head = defs_1.car(g);
    if (head === symbol_1.symbol(defs_1.SIN) || head === symbol_1.symbol(defs_1.COS)) {
        // u = alpha*x + beta = k*pi (sin) or pi/2 + k*pi (cos)
        const u = defs_1.cadr(g);
        const alpha = float_1.zzfloat(derivative_1.derivative(u, X));
        const beta = float_1.zzfloat(subst_1.subst(u, X, defs_1.Constants.zero));
        if (!defs_1.isdouble(alpha) || !defs_1.isdouble(beta) || alpha.d === 0) {
            return undefined;
        }
        const offset = head === symbol_1.symbol(defs_1.COS) ? Math.PI / 2 : 0;
        // ponytail: tries the zeros for |k| <= 1000, compute the k range if needed
        for (let k = -1000; k <= 1000; k++) {
            const r = (offset + k * Math.PI - beta.d) / alpha.d;
            if (inside(r)) {
                return `${Number(r.toPrecision(6))}`;
            }
        }
        return undefined;
    }
    if (!is_1.ispolyfactoredorexpandedform(g, X)) {
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
        if (defs_1.isdouble(re) &&
            defs_1.isdouble(im) &&
            Math.abs(im.d) < 1e-4 * Math.max(1, Math.abs(re.d)) &&
            inside(re.d)) {
            return `${Number(re.d.toPrecision(6))}`;
        }
    }
    return undefined;
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
