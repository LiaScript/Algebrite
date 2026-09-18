"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_aspiecewise = exports.piecewiseIntegral = exports.piecewiseDefint = exports.resolvePiecewise = exports.activeBranch = exports.mapPiecewise = exports.mapPiecewiseValues = exports.Eval_piecewise = exports.hasPiecewise = exports.isPiecewise = void 0;
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const assume_1 = require("./assume");
const bignum_1 = require("./bignum");
const derivative_1 = require("./derivative");
const eval_1 = require("./eval");
const float_1 = require("./float");
const integral_1 = require("./integral");
const is_1 = require("./is");
const limit_1 = require("./limit");
const list_1 = require("./list");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const subst_1 = require("./subst");
/* piecewise =====================================================================

Parameters
----------
value1, condition1, value2, condition2, ..., [default]

General description
-------------------
A function defined by cases. The conditions are tested in order: the first
true one selects its value, a false one drops its branch, an undecided one
keeps the branch symbolic. A trailing unpaired argument is the value
otherwise. The values of branches that are not taken are not evaluated.

*/
const NAME = 'piecewise';
const USAGE = 'value1, condition1, ..., [default]';
// a call of the builtin, not of a function the user bound to the name
function isPiecewise(p) {
    const head = defs_1.car(p);
    return defs_1.iscons(p) && defs_1.issymbol(head) && head.printname === NAME && symbol_1.get_binding(head) === head;
}
exports.isPiecewise = isPiecewise;
function hasPiecewise(p) {
    return defs_1.iscons(p) && (isPiecewise(p) || p.tail().some(hasPiecewise));
}
exports.hasPiecewise = hasPiecewise;
function branches(p) {
    const args = defs_1.iscons(p) ? p.tail() : [];
    const pairs = [];
    for (let i = 0; i + 1 < args.length; i += 2) {
        pairs.push([args[i], args[i + 1]]);
    }
    return { pairs, otherwise: args.length % 2 ? args[args.length - 1] : undefined };
}
// the same value in every branch and otherwise is that value
function build(pairs, otherwise) {
    if (otherwise !== undefined && pairs.every(([v]) => misc_1.equal(v, otherwise))) {
        return otherwise;
    }
    const args = [].concat(...pairs);
    return list_1.makeList(symbol_1.usr_symbol(NAME), ...args, ...(otherwise === undefined ? [] : [otherwise]));
}
function Eval_piecewise(p1) {
    const { pairs, otherwise } = branches(p1);
    if (pairs.length === 0 && otherwise === undefined) {
        run_1.stop(`piecewise: expected ${USAGE}`);
    }
    const kept = [];
    for (const [value, condition] of pairs) {
        const c = evalCondition(condition);
        if (!defs_1.isNumericAtom(c)) {
            kept.push([eval_1.Eval(value), c]);
        }
        else if (!is_1.isZeroAtomOrTensor(c)) {
            return build(kept, eval_1.Eval(value)); // true: the value otherwise
        }
    }
    if (kept.length === 0 && otherwise === undefined) {
        run_1.stop('piecewise: no condition holds and there is no default value');
    }
    return build(kept, otherwise === undefined ? undefined : eval_1.Eval(otherwise));
}
exports.Eval_piecewise = Eval_piecewise;
const isRelation = (p) => [defs_1.TESTLT, defs_1.TESTLE, defs_1.TESTGT, defs_1.TESTGE, defs_1.TESTEQ].some((r) => defs_1.car(p) === symbol_1.symbol(r));
// 1, 0 or the condition as the evaluator leaves it: comparisons cancel,
// and/or/not join their bounds and lose their decided parts
// (logic_simplify.ts). What cannot be a condition stops: 2, x+1, -x
function evalCondition(c) {
    const v = eval_1.Eval(c);
    if (defs_1.iscons(v) && !misc_1.equal(v, c) && (isRelation(v) || [defs_1.AND, defs_1.OR, defs_1.NOT].some((h) => defs_1.car(v) === symbol_1.symbol(h)))) {
        return evalCondition(v); // a symbol bound to a condition
    }
    const bad = defs_1.isNumericAtom(v)
        ? !is_1.isZeroAtomOrTensor(v) && !is_1.isplusone(v)
        : defs_1.istensor(v) || defs_1.isstr(v) || defs_1.isadd(v) || defs_1.ismultiply(v) || defs_1.ispower(v);
    if (bad) {
        run_1.stop(`piecewise: ${v} is not a condition, the arguments are ${USAGE}`);
    }
    return v;
}
// f applied to the value of every branch, conditions kept
function mapPiecewiseValues(p, f) {
    const { pairs, otherwise } = branches(p);
    return build(pairs.map(([v, c]) => [f(v), c]), otherwise === undefined ? undefined : f(otherwise));
}
exports.mapPiecewiseValues = mapPiecewiseValues;
// mapPiecewiseValues on every piecewise inside p
function mapPiecewise(p, f) {
    if (!defs_1.iscons(p)) {
        return p;
    }
    if (isPiecewise(p)) {
        return mapPiecewiseValues(p, f);
    }
    return list_1.makeList(defs_1.car(p), ...p.tail().map((q) => mapPiecewise(q, f)));
}
exports.mapPiecewise = mapPiecewise;
// the (unevaluated) value of the branch that holds at X = at, undefined
// when a condition is undecided there or no branch holds
function activeBranch(p, X, at) {
    const { pairs, otherwise } = branches(p);
    for (const [value, condition] of pairs) {
        const c = evalCondition(subst_1.subst(condition, X, at));
        if (!defs_1.isNumericAtom(c)) {
            return undefined;
        }
        if (!is_1.isZeroAtomOrTensor(c)) {
            return value;
        }
    }
    return otherwise;
}
exports.activeBranch = activeBranch;
// p with every piecewise replaced by its branch at X = at
function resolvePiecewise(p, X, at) {
    if (!defs_1.iscons(p)) {
        return p;
    }
    if (isPiecewise(p)) {
        const branch = activeBranch(p, X, at);
        return branch === undefined ? undefined : resolvePiecewise(branch, X, at);
    }
    const parts = p.tail().map((q) => resolvePiecewise(q, X, at));
    return parts.some((q) => q === undefined) ? undefined : list_1.makeList(defs_1.car(p), ...parts);
}
exports.resolvePiecewise = resolvePiecewise;
// The break points of the piecewise functions in p: the zeros of l-r for
// every comparison of their conditions, sorted. undefined when one cannot
// be found.
// ponytail: only comparisons linear in X with numeric coefficients, roots()
// on l-r would add polynomial conditions such as x^2<1
function breakPoints(p, X) {
    const cuts = [];
    const walk = (q, inCondition) => {
        if (!defs_1.iscons(q) || !find_1.Find(q, X)) {
            return true;
        }
        if (isPiecewise(q)) {
            return q.tail().every((arg, i) => walk(arg, inCondition || i % 2 === 1));
        }
        if (!inCondition) {
            return q.tail().every((arg) => walk(arg, false));
        }
        if ([defs_1.AND, defs_1.OR, defs_1.NOT].some((h) => defs_1.car(q) === symbol_1.symbol(h))) {
            return q.tail().every((arg) => walk(arg, true));
        }
        if (!isRelation(q)) {
            return false;
        }
        const g = add_1.subtract(defs_1.cadr(q), defs_1.caddr(q));
        const slope = derivative_1.derivative(g, X);
        if (!defs_1.isdouble(float_1.zzfloat(slope))) {
            return false;
        }
        if (is_1.isZeroAtomOrTensor(slope)) {
            return true;
        }
        const u = multiply_1.negate(multiply_1.divide(eval_1.Eval(subst_1.subst(g, X, defs_1.Constants.zero)), slope));
        const d = float_1.zzfloat(u);
        if (!defs_1.isdouble(d)) {
            return false;
        }
        if (!cuts.some((c) => c.d === d.d)) {
            cuts.push({ u, d: d.d });
        }
        return true;
    };
    return walk(p, false) ? cuts.sort((a, b) => a.d - b.d) : undefined;
}
// a point inside (lo, hi), either may be infinite
function inside(lo, hi) {
    if (lo === -Infinity) {
        return hi === Infinity ? 0 : hi - 1;
    }
    return hi === Infinity ? lo + 1 : (lo + hi) / 2;
}
function pieceAt(F, X, at) {
    const G = resolvePiecewise(F, X, bignum_1.double(at));
    return G === undefined ? undefined : eval_1.Eval(G);
}
// The integral of F from A to B (a and b as numbers, infinite allowed): the
// interval is split at the break points and `definite` integrates the
// active branch on every piece. undefined when the break points or the
// branch of a piece cannot be found.
function piecewiseDefint(F, X, [A, a], [B, b], definite) {
    if (a > b) {
        const reversed = piecewiseDefint(F, X, [B, b], [A, a], definite);
        return reversed === undefined ? undefined : multiply_1.negate(reversed);
    }
    if (a === b) {
        return defs_1.Constants.zero;
    }
    const cuts = breakPoints(F, X);
    if (cuts === undefined) {
        return undefined;
    }
    const points = [{ u: A, d: a }, ...cuts.filter((c) => c.d > a && c.d < b), { u: B, d: b }];
    let total = defs_1.Constants.zero;
    for (let i = 0; i + 1 < points.length; i++) {
        const G = pieceAt(F, X, inside(points[i].d, points[i + 1].d));
        if (G === undefined) {
            return undefined;
        }
        total = add_1.add(total, definite(G, points[i].u, points[i + 1].u));
    }
    return total;
}
exports.piecewiseDefint = piecewiseDefint;
// The continuous antiderivative: the antiderivative of the active branch
// between the break points, plus the constant that joins it to the piece
// on its left, as piecewise(G0, X<c1, G1+K1, X<c2, ...). undefined when the
// break points or a branch cannot be found, or a piece has no finite limit
// at its break point (log(x) at 0).
function piecewiseIntegral(F, X) {
    const cuts = breakPoints(F, X);
    if (cuts === undefined || cuts.length === 0) {
        return undefined;
    }
    const bounds = [-Infinity, ...cuts.map((c) => c.d), Infinity];
    const pieces = cuts.map((_, i) => i).concat(cuts.length).map((i) => pieceAt(F, X, inside(bounds[i], bounds[i + 1])));
    if (pieces.some((p) => p === undefined)) {
        return undefined;
    }
    let current = integral_1.integral(pieces[0], X);
    const pairs = [];
    try {
        cuts.forEach((c, i) => {
            if (misc_1.equal(pieces[i], pieces[i + 1])) {
                return; // a single point (x==0) or the break point of another piece
            }
            pairs.push([current, list_1.makeList(symbol_1.symbol(defs_1.TESTLT), X, c.u)]);
            const next = integral_1.integral(pieces[i + 1], X);
            const K = add_1.subtract(limit_1.limit(current, X, c.u, [-1]), limit_1.limit(next, X, c.u, [1]));
            if (find_1.Find(K, symbol_1.symbol(defs_1.INF))) {
                throw new Error('no continuous antiderivative');
            }
            current = add_1.add(next, K);
        });
    }
    catch (e) {
        return undefined;
    }
    return build(pairs, current);
}
exports.piecewiseIntegral = piecewiseIntegral;
// aspiecewise(expr): abs, sgn of real arguments and min, max of two
// arguments written as cases
function Eval_aspiecewise(p1) {
    misc_1.checkArgCount(p1, 1);
    return eval_1.Eval(asPiecewise(eval_1.Eval(defs_1.cadr(p1))));
}
exports.Eval_aspiecewise = Eval_aspiecewise;
function asPiecewise(p) {
    if (!defs_1.iscons(p)) {
        return p;
    }
    const args = p.tail().map(asPiecewise);
    const [a, b] = args;
    const cases = (...list) => list_1.makeList(symbol_1.usr_symbol(NAME), ...list);
    const rel = (name, l, r) => list_1.makeList(symbol_1.symbol(name), l, r);
    const { zero, one, negOne } = defs_1.Constants;
    if (args.length === 1 && assume_1.isReal(a) === true) {
        if (defs_1.car(p) === symbol_1.symbol(defs_1.ABS)) {
            return cases(multiply_1.negate(a), rel(defs_1.TESTLT, a, zero), a);
        }
        if (defs_1.car(p) === symbol_1.symbol(defs_1.SGN)) {
            return cases(negOne, rel(defs_1.TESTLT, a, zero), zero, rel(defs_1.TESTEQ, a, zero), one);
        }
    }
    if (args.length === 2 && (defs_1.car(p) === symbol_1.symbol(defs_1.MIN) || defs_1.car(p) === symbol_1.symbol(defs_1.MAX))) {
        return cases(a, rel(defs_1.car(p) === symbol_1.symbol(defs_1.MIN) ? defs_1.TESTLE : defs_1.TESTGE, a, b), b);
    }
    return list_1.makeList(defs_1.car(p), ...args);
}
