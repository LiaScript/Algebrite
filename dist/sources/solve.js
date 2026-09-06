"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_solve = void 0;
const run_1 = require("../runtime/run");
const is_1 = require("./is");
const roots_1 = require("./roots");
// solve(expr, x) / solve(lhs == rhs, x): polynomial equation solving only.
// Delegates to roots() for the actual solving — see roots.ts. Non-polynomial
// equations (e.g. transcendental) are explicitly out of scope for now.
function Eval_solve(p1) {
    const [POLY1, X1] = roots_1.normalizeEquation(p1);
    if (!is_1.ispolyexpandedform(POLY1, X1)) {
        run_1.stop('solve: 1st argument is not a polynomial in the variable ' +
            X1 +
            ' — solve() currently only supports polynomial equations');
    }
    return roots_1.roots(POLY1, X1);
}
exports.Eval_solve = Eval_solve;
