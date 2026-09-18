"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultant = exports.Eval_resultant = void 0;
const defs_1 = require("../runtime/defs");
const symbol_1 = require("../runtime/symbol");
const coeff_1 = require("./coeff");
const degree_1 = require("./degree");
const det_1 = require("./det");
const eval_1 = require("./eval");
const guess_1 = require("./guess");
const is_1 = require("./is");
/* resultant =====================================================================

Parameters
----------
f,g,x

General description
-------------------
Returns the resultant of the polynomials f and g with respect to x: an
expression without x that is zero exactly when f and g have a common root
in x. The x argument can be omitted for polynomials in x.

  resultant(x^2+y^2-1,x-y,y)
  > 2*x^2-1

*/
function Eval_resultant(p1) {
    const f = eval_1.Eval(defs_1.cadr(p1));
    const g = eval_1.Eval(defs_1.caddr(p1));
    const arg = eval_1.Eval(defs_1.cadddr(p1));
    const x = arg === symbol_1.symbol(defs_1.NIL) ? guess_1.guess(f) : arg;
    degree_1.checkpoly('resultant', f, x);
    degree_1.checkpoly('resultant', g, x);
    return resultant(f, g, x);
}
exports.Eval_resultant = Eval_resultant;
// Determinant of the Sylvester matrix: deg g shifted rows of the
// coefficients of f, then deg f shifted rows of those of g.
// ponytail: determinant() expands over all permutations, O(n!) in
// deg f + deg g; switch to Bareiss elimination if large degrees matter.
function resultant(f, g, x) {
    var _a;
    if (is_1.isZeroAtomOrTensor(f) || is_1.isZeroAtomOrTensor(g)) {
        return defs_1.Constants.zero;
    }
    const a = coeff_1.coeff(f, x).reverse();
    const b = coeff_1.coeff(g, x).reverse();
    const m = a.length - 1;
    const n = b.length - 1;
    const size = m + n;
    const elems = [];
    for (let i = 0; i < size; i++) {
        const [c, shift] = i < n ? [a, i] : [b, i - n];
        for (let j = 0; j < size; j++) {
            elems.push((_a = c[j - shift]) !== null && _a !== void 0 ? _a : defs_1.Constants.zero);
        }
    }
    return det_1.determinant(elems, size);
}
exports.resultant = resultant;
