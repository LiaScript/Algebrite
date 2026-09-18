"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solveInequalities = exports.solveInequality = void 0;
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const assume_1 = require("./assume");
const derivative_1 = require("./derivative");
const multiply_1 = require("./multiply");
const simplify_1 = require("./simplify");
const bignum_1 = require("./bignum");
const denominator_1 = require("./denominator");
const eval_1 = require("./eval");
const float_1 = require("./float");
const is_1 = require("./is");
const list_1 = require("./list");
const numerator_1 = require("./numerator");
const rationalize_1 = require("./rationalize");
const solve_transcendental_1 = require("./solve_transcendental");
const subst_1 = require("./subst");
// solve(lhs < rhs, x) for a real x: the line is cut at the real roots of
// numerator and denominator of lhs-rhs, at the roots of every log or even
// radical argument (where the expression stops being real) and at 0, the
// inequality is tested on each open piece and at each cut, and the true
// pieces are joined. The answer is a comparison, and(...) of two, or(...)
// of several pieces, 1 when it always holds and 0 when it never does.
function solveInequality(rel, x) {
    return solveInequalities([rel], x);
}
exports.solveInequality = solveInequality;
// Several relations: the pieces of the line where all of them hold.
function solveInequalities(rels, x) {
    const sides = rels.map((rel) => ({
        op: defs_1.car(rel),
        E: add_1.subtract(eval_1.Eval(defs_1.cadr(rel)), eval_1.Eval(defs_1.caddr(rel)))
    }));
    if (sides.length === 1) {
        const linear = linearWithParameters(sides[0].op, sides[0].E, x);
        if (linear !== undefined) {
            return linear;
        }
    }
    const constant = sides.filter(({ E }) => !find_1.Find(E, x));
    for (const { op, E } of constant) {
        const t = truth(op, E);
        if (t === undefined) {
            run_1.stop('solve: inequalities with parameters are not supported');
        }
        if (!t) {
            return defs_1.Constants.zero;
        }
    }
    const active = sides.filter(({ E }) => find_1.Find(E, x));
    if (active.length === 0) {
        return defs_1.Constants.one;
    }
    if (active.some(({ E }) => hasTrig(E, x))) {
        run_1.stop('solve: periodic inequalities are not supported');
    }
    // per relation: the zeros of the numerator, and every other cut (poles and
    // the ends of the real domain)
    const cutSets = active.map(({ E }) => {
        const R = rationalize_1.rationalize(E);
        return {
            zeros: realRoots(numerator_1.numerator(R), x),
            others: [denominator_1.denominator(R), ...domainArgs(E, x)].reduce((acc, p) => acc.concat(realRoots(p, x)), [])
        };
    });
    const cuts = cutSets
        .reduce((acc, c) => acc.concat(c.zeros, c.others), [])
        .concat([defs_1.Constants.zero]);
    const isAmong = (v, list) => list.some((q) => Math.abs(toNumber(q) - toNumber(v)) <= 1e-12 * Math.max(1, Math.abs(toNumber(v))));
    const pts = cuts
        .filter((p, i) => cuts.findIndex((q) => toNumber(q) === toNumber(p)) === i)
        .sort((a, b) => toNumber(a) - toNumber(b));
    const n = pts.length;
    // segments alternate: interval before pts[0], pts[0], interval, ..., after
    let parametric = false;
    const holdsAt = (v) => {
        try {
            if (assume_1.violatesAssumptions(v, x)) {
                return false;
            }
            return active.every(({ op, E }, i) => {
                // at a zero of E the value is exactly 0, whatever rounding says
                // about 3^x - 7^15 there: only <= and >= hold
                if (isAmong(v, cutSets[i].zeros) && !isAmong(v, cutSets[i].others)) {
                    return op === symbol_1.symbol(defs_1.TESTLE) || op === symbol_1.symbol(defs_1.TESTGE);
                }
                const value = eval_1.Eval(subst_1.subst(E, x, v));
                const f = float_1.zzfloat(value);
                if (defs_1.isdouble(f) && !Number.isFinite(f.d)) {
                    return false; // log(0) and the like
                }
                // symbols left over: the sign depends on a parameter
                if (!isNumberLike(f)) {
                    parametric = true;
                }
                return truth(op, value) === true;
            });
        }
        catch (e) {
            return false; // a pole
        }
    };
    const segments = [];
    for (let i = 0; i <= n; i++) {
        const lo = i === 0 ? toNumber(pts[0]) - 1 : toNumber(pts[i - 1]);
        const hi = i === n ? toNumber(pts[n - 1]) + 1 : toNumber(pts[i]);
        segments.push(holdsAt(bignum_1.double((lo + hi) / 2)));
        if (i < n) {
            segments.push(holdsAt(pts[i]));
        }
    }
    if (parametric) {
        run_1.stop('solve: inequalities with parameters are not supported');
    }
    const pieces = [];
    let start = -1;
    for (let i = 0; i <= segments.length; i++) {
        if (i < segments.length && segments[i]) {
            if (start < 0) {
                start = i;
            }
            continue;
        }
        if (start >= 0) {
            pieces.push(piece(x, pts, start, i - 1));
            start = -1;
        }
    }
    if (pieces.length === 0) {
        return defs_1.Constants.zero;
    }
    if (pieces.length === 1 && pieces[0] === defs_1.Constants.one) {
        return defs_1.Constants.one;
    }
    return pieces.length === 1 ? pieces[0] : list_1.makeList(symbol_1.symbol(defs_1.OR), ...pieces);
}
exports.solveInequalities = solveInequalities;
// s*x + c op 0 with s free of x and symbols in the root: the sign of s
// decides the direction, x op -c/s or the flipped relation. undefined when
// E is not of that shape or has no parameters; stops when the sign of s is
// not known.
function linearWithParameters(op, E, x) {
    const slope = derivative_1.derivative(E, x);
    if (!find_1.Find(E, x) || find_1.Find(slope, x)) {
        return undefined;
    }
    const root = simplify_1.simplify(multiply_1.negate(multiply_1.divide(eval_1.Eval(subst_1.subst(E, x, defs_1.Constants.zero)), slope)));
    if (defs_1.isdouble(float_1.zzfloat(root)) && isNumberLike(float_1.zzfloat(slope))) {
        return undefined; // all numbers: the general method handles it
    }
    const sign = assume_1.facts(slope);
    if (!sign.positive && !sign.negative) {
        run_1.stop('solve: inequalities with parameters are not supported');
    }
    const flipped = {
        [defs_1.TESTLT]: defs_1.TESTGT,
        [defs_1.TESTGT]: defs_1.TESTLT,
        [defs_1.TESTLE]: defs_1.TESTGE,
        [defs_1.TESTGE]: defs_1.TESTLE
    };
    const name = op.printname;
    return list_1.makeList(symbol_1.symbol(sign.positive ? name : flipped[name]), x, root);
}
// The condition for the run of segments a..b: even indices are open
// intervals (2*j is the one below pts[j]), odd indices 2*j+1 are pts[j].
function piece(x, pts, a, b) {
    const conds = [];
    if (a % 2 === 1) {
        conds.push(list_1.makeList(symbol_1.symbol(defs_1.TESTGE), x, pts[(a - 1) / 2]));
    }
    else if (a > 0) {
        conds.push(list_1.makeList(symbol_1.symbol(defs_1.TESTGT), x, pts[a / 2 - 1]));
    }
    if (b % 2 === 1) {
        if (a === b) {
            return list_1.makeList(symbol_1.symbol(defs_1.TESTEQ), x, pts[(b - 1) / 2]);
        }
        conds.push(list_1.makeList(symbol_1.symbol(defs_1.TESTLE), x, pts[(b - 1) / 2]));
    }
    else if (b / 2 < pts.length) {
        conds.push(list_1.makeList(symbol_1.symbol(defs_1.TESTLT), x, pts[b / 2]));
    }
    if (conds.length === 0) {
        return defs_1.Constants.one;
    }
    return conds.length === 1 ? conds[0] : list_1.makeList(symbol_1.symbol(defs_1.AND), ...conds);
}
// true/false when v op 0 evaluates to 1/0, undefined when it cannot be
// decided (symbols), false when evaluating it fails (a pole)
function truth(op, v) {
    try {
        const r = eval_1.Eval(list_1.makeList(op, v, defs_1.Constants.zero));
        if (is_1.isone(r)) {
            return true;
        }
        return defs_1.isrational(r) || defs_1.isdouble(r) ? false : undefined;
    }
    catch (e) {
        return false;
    }
}
function toNumber(p) {
    const f = float_1.zzfloat(p);
    return defs_1.isdouble(f) ? f.d : NaN;
}
// The real roots of p in x as exact values; a root with other symbols in it
// has no place on the line and stops.
function realRoots(p, x) {
    if (!find_1.Find(p, x)) {
        return [];
    }
    let sols;
    try {
        sols = solve_transcendental_1.solveEquation(p, x);
    }
    catch (e) {
        run_1.stop('solve: cannot solve the inequality for ' + x);
    }
    return sols.filter((s) => {
        const f = float_1.zzfloat(s);
        if (defs_1.isdouble(f)) {
            return true;
        }
        if (!find_1.Find(f, x) && isNumberLike(f)) {
            return false; // complex
        }
        return run_1.stop('solve: inequalities with parameters are not supported');
    });
}
// a number after zzfloat: doubles combined by operators (complex values
// keep the (-1)^(1/2) of i), nothing symbolic
function isNumberLike(p) {
    return defs_1.isNumericAtom(p) || (defs_1.iscons(p) && p.tail().every(isNumberLike));
}
function hasTrig(p, x) {
    if (!defs_1.iscons(p)) {
        return false;
    }
    if ([defs_1.SIN, defs_1.COS, defs_1.TAN].some((f) => defs_1.car(p) === symbol_1.symbol(f)) && find_1.Find(defs_1.cadr(p), x)) {
        return true;
    }
    return p.tail().some((el) => hasTrig(el, x));
}
// arguments of log and of even radicals that contain x
function domainArgs(p, x, acc = []) {
    if (!defs_1.iscons(p)) {
        return acc;
    }
    if (defs_1.car(p) === symbol_1.symbol(defs_1.LOG) && find_1.Find(defs_1.cadr(p), x)) {
        acc.push(defs_1.cadr(p));
    }
    const e = defs_1.caddr(p);
    if (defs_1.ispower(p) &&
        find_1.Find(defs_1.cadr(p), x) &&
        defs_1.isrational(e) &&
        !is_1.isinteger(e) &&
        e.b.isEven()) {
        acc.push(defs_1.cadr(p));
    }
    p.tail().forEach((el) => domainArgs(el, x, acc));
    return acc;
}
