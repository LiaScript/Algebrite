"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_solve = void 0;
const defs_1 = require("../runtime/defs");
const alloc_1 = require("../runtime/alloc");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const derivative_1 = require("./derivative");
const det_1 = require("./det");
const eval_1 = require("./eval");
const inner_1 = require("./inner");
const inv_1 = require("./inv");
const is_1 = require("./is");
const multiply_1 = require("./multiply");
const roots_1 = require("./roots");
const simplify_1 = require("./simplify");
const subst_1 = require("./subst");
const tensor_1 = require("./tensor");
// solve(expr, x) / solve(lhs == rhs, x): polynomial equation solving only.
// Delegates to roots() for the actual solving — see roots.ts. Non-polynomial
// equations (e.g. transcendental) are explicitly out of scope for now.
//
// solve([eq1, eq2, ...], [x, y, ...]): linear system, see solveLinearSystem.
function Eval_solve(p1) {
    // The 2nd arg is checked first: evaluating the 1st arg of solve(x=3,x)
    // would perform the assignment, so leave that to normalizeEquation.
    const vars = eval_1.Eval(defs_1.caddr(p1));
    if (defs_1.istensor(vars)) {
        const eqs = eval_1.Eval(defs_1.cadr(p1));
        if (!defs_1.istensor(eqs)) {
            run_1.stop('solve: a list of variables needs a list of equations');
        }
        return solveLinearSystem(eqs, vars);
    }
    const [POLY1, X1] = roots_1.normalizeEquation(p1);
    if (!is_1.ispolyexpandedform(POLY1, X1)) {
        run_1.stop('solve: 1st argument is not a polynomial in the variable ' +
            X1 +
            ' — solve() currently only supports polynomial equations');
    }
    return roots_1.roots(POLY1, X1);
}
exports.Eval_solve = Eval_solve;
// Returns the solution vector in variable order. Coefficients come from the
// derivatives, constants from the equations at all-zero variables; rebuilding
// each equation from those and comparing catches any nonlinear term.
function solveLinearSystem(eqs, vars) {
    const n = vars.nelem;
    if (eqs.nelem !== n) {
        run_1.stop('solve: need as many equations as variables');
    }
    const A = alloc_1.alloc_tensor(n * n);
    A.ndim = 2;
    A.dim = [n, n];
    const b = alloc_1.alloc_tensor(n);
    b.ndim = 1;
    b.dim = [n];
    eqs.elem.forEach((e, i) => {
        const eq = defs_1.car(e) === symbol_1.symbol(defs_1.TESTEQ) ? add_1.subtract(defs_1.cadr(e), defs_1.caddr(e)) : e;
        let rebuilt = eval_1.Eval(vars.elem.reduce((acc, v) => subst_1.subst(acc, v, defs_1.Constants.zero), eq));
        b.elem[i] = multiply_1.negate(rebuilt);
        vars.elem.forEach((v, j) => {
            const c = derivative_1.derivative(eq, v);
            A.elem[i * n + j] = c;
            rebuilt = add_1.add(rebuilt, multiply_1.multiply(c, v));
        });
        if (!is_1.isZeroAtomOrTensor(simplify_1.simplify(add_1.subtract(rebuilt, eq)))) {
            run_1.stop('solve: system is not linear in the given variables');
        }
    });
    tensor_1.check_tensor_dimensions(A);
    tensor_1.check_tensor_dimensions(b);
    if (is_1.isZeroAtomOrTensor(det_1.det(A))) {
        run_1.stop('solve: system has no unique solution');
    }
    return inner_1.inner(inv_1.inv(A), b);
}
