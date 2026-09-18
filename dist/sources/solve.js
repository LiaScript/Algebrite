"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_solve = void 0;
const defs_1 = require("../runtime/defs");
const alloc_1 = require("../runtime/alloc");
const run_1 = require("../runtime/run");
const find_1 = require("../runtime/find");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const derivative_1 = require("./derivative");
const det_1 = require("./det");
const eval_1 = require("./eval");
const inner_1 = require("./inner");
const inv_1 = require("./inv");
const is_1 = require("./is");
const multiply_1 = require("./multiply");
const assume_1 = require("./assume");
const coeff_1 = require("./coeff");
const misc_1 = require("./misc");
const resultant_1 = require("./resultant");
const roots_1 = require("./roots");
const rref_1 = require("./rref");
const scan_1 = require("./scan");
const simplify_1 = require("./simplify");
const subst_1 = require("./subst");
const tensor_1 = require("./tensor");
// solve(expr, x) / solve(lhs == rhs, x): polynomial equation solving only.
// Delegates to roots() for the actual solving — see roots.ts. Non-polynomial
// equations (e.g. transcendental) are explicitly out of scope for now.
//
// solve([eq1, eq2, ...], [x, y, ...]): linear system, see solveLinearSystem,
// or polynomial system, see solvePolySystem. Equations may use = or ==;
// without the variable list the variables are collected from the equations
// in order of first appearance.
function Eval_solve(p1) {
    // A literal list of equations is converted element-wise before anything is
    // evaluated: Eval of [x+y=3] would treat x+y=3 as a function definition.
    const eqsArg = defs_1.cadr(p1);
    const vars = eval_1.Eval(defs_1.caddr(p1));
    if (defs_1.istensor(eqsArg) || defs_1.istensor(vars)) {
        const eqs = defs_1.istensor(eqsArg)
            ? scan_1.build_tensor(eqsArg.elem.map(roots_1.equationToExpr))
            : eval_1.Eval(eqsArg);
        if (!defs_1.istensor(eqs)) {
            run_1.stop('solve: a list of variables needs a list of equations');
        }
        return solveLinearSystem(eqs, defs_1.istensor(vars)
            ? vars
            : scan_1.build_tensor(vars === symbol_1.symbol(defs_1.NIL) ? freeSymbols(eqs) : [vars]));
    }
    const [POLY1, X1] = roots_1.normalizeEquation(p1);
    if (!is_1.ispolyexpandedform(POLY1, X1)) {
        run_1.stop('solve: 1st argument is not a polynomial in the variable ' +
            X1 +
            ' — solve() currently only supports polynomial equations');
    }
    return roots_1.keepAssumedRoots(roots_1.roots(POLY1, X1), X1, 'solve');
}
exports.Eval_solve = Eval_solve;
// Variables in order of first appearance.
function freeSymbols(p) {
    const acc = [];
    symbol_1.collectUserSymbols(p, acc);
    return acc;
}
// Returns the solution vector in variable order. Coefficients come from the
// derivatives, constants from the equations at all-zero variables; rebuilding
// each equation from those and comparing catches any nonlinear term, which
// hands the system to solvePolySystem.
function solveLinearSystem(eqs, vars) {
    const n = vars.nelem;
    if (!vars.elem.every(defs_1.issymbol) || new Set(vars.elem).size !== n) {
        run_1.stop('solve: variables must be distinct symbols');
    }
    if (eqs.nelem !== n) {
        run_1.stop('solve: need as many equations as variables');
    }
    const A = alloc_1.alloc_tensor(n * n);
    A.ndim = 2;
    A.dim = [n, n];
    const b = alloc_1.alloc_tensor(n);
    b.ndim = 1;
    b.dim = [n];
    const exprs = eqs.elem.map((e) => defs_1.car(e) === symbol_1.symbol(defs_1.TESTEQ) ? add_1.subtract(defs_1.cadr(e), defs_1.caddr(e)) : e);
    let linear = true;
    exprs.forEach((eq, i) => {
        let rebuilt = eval_1.Eval(vars.elem.reduce((acc, v) => subst_1.subst(acc, v, defs_1.Constants.zero), eq));
        b.elem[i] = multiply_1.negate(rebuilt);
        vars.elem.forEach((v, j) => {
            const c = derivative_1.derivative(eq, v);
            A.elem[i * n + j] = c;
            rebuilt = add_1.add(rebuilt, multiply_1.multiply(c, v));
        });
        linear = linear && is_1.isZeroAtomOrTensor(simplify_1.simplify(add_1.subtract(rebuilt, eq)));
    });
    if (!linear) {
        return solvePolySystemMatrix(exprs, vars.elem);
    }
    tensor_1.check_tensor_dimensions(A);
    tensor_1.check_tensor_dimensions(b);
    if (is_1.isZeroAtomOrTensor(det_1.det(A))) {
        run_1.stop('solve: system has no unique solution');
    }
    const solution = inner_1.inner(inv_1.inv(A), b);
    vars.elem.forEach((v, i) => {
        if (assume_1.violatesAssumptions(solution.elem[i], v)) {
            run_1.stop(`solve: no solution satisfies the assumptions about ${v}`);
        }
    });
    return solution;
}
// Solutions as a matrix, one row per solution, even for a single one.
function solvePolySystemMatrix(eqs, vars) {
    eqs.forEach((e) => vars.forEach((v) => {
        if (find_1.Find(e, v) && !is_1.ispolyexpandedform(e, v)) {
            run_1.stop('solve: system is not polynomial in the given variables');
        }
    }));
    const rows = solvePolySystem(eqs, vars)
        .sort(cmpRows)
        .filter((r, i, all) => i === 0 || cmpRows(r, all[i - 1]) !== 0);
    if (rows.length === 0) {
        run_1.stop('solve: system has no solution');
    }
    const kept = rows.filter((r) => !r.some((value, i) => assume_1.violatesAssumptions(value, vars[i])));
    if (kept.length === 0) {
        run_1.stop('solve: no solution satisfies the assumptions about ' + vars.join(','));
    }
    return rref_1.matrix(kept);
}
function cmpRows(a, b) {
    for (let i = 0; i < a.length; i++) {
        const c = misc_1.cmp_expr(a[i], b[i]);
        if (c !== 0) {
            return c;
        }
    }
    return 0;
}
// Rows of values in variable order. The last variable is eliminated with
// resultants against the equation of lowest degree in it, the smaller system
// is solved recursively, then each of its solutions is substituted back and
// the roots in the last variable that satisfy every equation are kept:
// the resultant can have roots that extend to no common solution.
// ponytail: the back check needs simplify() to reach exactly 0, nested
// radicals it can't denest drop real solutions; add a numeric check then.
function solvePolySystem(eqs, vars) {
    const v = vars[vars.length - 1];
    const rest = vars.slice(0, -1);
    const partials = rest.length === 0 ? [[]] : solvePolySystem(eliminate(eqs, v), rest);
    const rows = [];
    for (const partial of partials) {
        const sub = eqs.map((e) => eval_1.Eval(rest.reduce((acc, w, i) => subst_1.subst(acc, w, partial[i]), e)));
        const pivot = pivotFor(sub, v);
        if (pivot === undefined) {
            if (sub.every((e) => is_1.isZeroAtomOrTensor(simplify_1.simplify(e)))) {
                run_1.stop('solve: system has infinitely many solutions');
            }
            continue;
        }
        for (const r of roots_1.rootsList(pivot, v)) {
            if (sub.every((e) => is_1.isZeroAtomOrTensor(simplify_1.simplify(eval_1.Eval(subst_1.subst(e, v, r)))))) {
                rows.push([...partial, r]);
            }
        }
    }
    return rows;
}
function eliminate(eqs, v) {
    const pivot = pivotFor(eqs, v);
    return eqs
        .filter((e) => e !== pivot)
        .map((g) => {
        if (!find_1.Find(g, v)) {
            return g;
        }
        const r = resultant_1.resultant(pivot, g, v);
        if (is_1.isZeroAtomOrTensor(r)) {
            // a common factor in v: a whole curve of solutions
            run_1.stop('solve: system has infinitely many solutions');
        }
        return r;
    });
}
// The equation of lowest degree in v, undefined if none contains v.
function pivotFor(eqs, v) {
    const degree = (e) => coeff_1.coeff(e, v).length;
    return eqs
        .filter((e) => find_1.Find(e, v))
        .reduce((best, e) => (best === undefined || degree(e) < degree(best) ? e : best), undefined);
}
