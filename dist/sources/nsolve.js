"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_nsolve = void 0;
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const bignum_1 = require("./bignum");
const derivative_1 = require("./derivative");
const eval_1 = require("./eval");
const float_1 = require("./float");
const guess_1 = require("./guess");
const roots_1 = require("./roots");
const subst_1 = require("./subst");
const MAX_ITER = 100;
// nsolve(f, x, x0):     Newton's method from x0 (default 0)
// nsolve(f, x, [a,b]):  bisection if f(a), f(b) differ in sign, else secant
// f may be an equation (lhs = rhs). Real roots only; see nroots for
// all (complex) roots of a polynomial.
function Eval_nsolve(p1) {
    const f = roots_1.equationToExpr(defs_1.cadr(p1));
    const xArg = eval_1.Eval(defs_1.caddr(p1));
    const x = xArg === symbol_1.symbol(defs_1.NIL) ? guess_1.guess(f) : xArg;
    const start = eval_1.Eval(defs_1.cadddr(p1));
    const fn = (v) => toNumber(subst_1.subst(f, x, bignum_1.double(v)));
    if (defs_1.istensor(start)) {
        if (start.nelem !== 2) {
            run_1.stop('nsolve: interval must be [a,b]');
        }
        const a = toNumber(start.elem[0]);
        const b = toNumber(start.elem[1]);
        const fa = fn(a);
        const fb = fn(b);
        if (fa === 0 || fb === 0) {
            return bignum_1.double(fa === 0 ? a : b);
        }
        return bignum_1.double(Math.sign(fa) * Math.sign(fb) < 0
            ? bisection(fn, a, b, fa, fb)
            : secant(fn, a, b));
    }
    const df = derivative_1.derivative(f, x);
    const x0 = start === symbol_1.symbol(defs_1.NIL) ? 0 : toNumber(start);
    return bignum_1.double(newton(fn, (v) => toNumber(subst_1.subst(df, x, bignum_1.double(v))), x0));
}
exports.Eval_nsolve = Eval_nsolve;
function toNumber(p) {
    const r = float_1.zzfloat(p);
    if (!defs_1.isdouble(r)) {
        run_1.stop('nsolve: expression does not evaluate to a real number: ' + r);
    }
    return r.d;
}
const converged = (dx, x) => Math.abs(dx) < 1e-12 * Math.max(1, Math.abs(x));
function newton(f, df, x) {
    for (let i = 0; i < MAX_ITER; i++) {
        const fx = f(x);
        if (fx === 0) {
            return x;
        }
        const dx = fx / df(x);
        if (!isFinite(dx)) {
            break;
        }
        x -= dx;
        if (converged(dx, x)) {
            return x;
        }
    }
    return run_1.stop('nsolve: no convergence, try another start value');
}
function secant(f, a, b) {
    let fa = f(a);
    for (let i = 0; i < MAX_ITER; i++) {
        const fb = f(b);
        const dx = (fb * (b - a)) / (fb - fa);
        if (!isFinite(dx)) {
            break;
        }
        [a, fa, b] = [b, fb, b - dx];
        if (converged(dx, b)) {
            return b;
        }
    }
    return run_1.stop('nsolve: no convergence, try another interval');
}
function bisection(f, a, b, fa, fb) {
    const bound = Math.max(Math.abs(fa), Math.abs(fb));
    for (let i = 0; i < 200 && !converged(b - a, a); i++) {
        const m = (a + b) / 2;
        const fm = f(m);
        if (fm === 0) {
            return m;
        }
        if (Math.sign(fm) === Math.sign(fa)) {
            [a, fa] = [m, fm];
        }
        else {
            b = m;
        }
    }
    const m = (a + b) / 2;
    // near a root |f| shrinks; growing past both endpoints means the sign
    // change comes from a pole, e.g. tan(x) on [1,2]
    if (!(Math.abs(f(m)) <= bound)) {
        run_1.stop('nsolve: sign change without a root, the function has a pole');
    }
    return m;
}
