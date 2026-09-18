"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.degree = exports.checkpoly = exports.Eval_degree = void 0;
const defs_1 = require("../runtime/defs");
const symbol_1 = require("../runtime/symbol");
const misc_1 = require("../sources/misc");
const eval_1 = require("./eval");
const guess_1 = require("./guess");
const is_1 = require("./is");
const add_1 = require("./add");
const multiply_1 = require("./multiply");
const run_1 = require("../runtime/run");
/* deg =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
p,x

General description
-------------------
Returns the degree of polynomial p(x).

*/
function Eval_degree(p1) {
    const poly = eval_1.Eval(defs_1.cadr(p1));
    p1 = eval_1.Eval(defs_1.caddr(p1));
    const variable = p1 === symbol_1.symbol(defs_1.NIL) ? guess_1.guess(poly) : p1;
    checkpoly('deg', poly, variable);
    return degree(poly, variable);
}
exports.Eval_degree = Eval_degree;
// degree and leading coefficient only make sense for polynomials
function checkpoly(name, poly, variable) {
    if (!defs_1.issymbol(variable) || !is_1.ispolyfactoredorexpandedform(poly, variable)) {
        run_1.stop(`${name}: 1st argument is not a polynomial in the variable ${variable}`);
    }
}
exports.checkpoly = checkpoly;
//-----------------------------------------------------------------------------
//
//  Find the degree of a polynomial
//
//  Input:    POLY    p(x)
//            X       x
//
//  Output:    Result
//
//  Note: Also works on factored forms, (x+1)^2*(x-1) has degree 3. For
//  anything else, e.g. sin(x), it is the largest numerical power of x
//  found in it.
//
//-----------------------------------------------------------------------------
function degree(POLY, X) {
    if (misc_1.equal(POLY, X)) {
        return defs_1.Constants.one;
    }
    if (defs_1.ispower(POLY) && defs_1.isNumericAtom(defs_1.caddr(POLY))) {
        if (misc_1.equal(defs_1.cadr(POLY), X)) {
            return misc_1.lessp(defs_1.Constants.zero, defs_1.caddr(POLY)) ? defs_1.caddr(POLY) : defs_1.Constants.zero;
        }
        if (is_1.isposint(defs_1.caddr(POLY))) {
            return multiply_1.multiply(degree(defs_1.cadr(POLY), X), defs_1.caddr(POLY));
        }
    }
    if (defs_1.ismultiply(POLY)) {
        return POLY.tail().reduce((a, b) => add_1.add(a, degree(b, X)), defs_1.Constants.zero);
    }
    if (defs_1.iscons(POLY)) {
        return POLY.tail().reduce((a, b) => {
            const d = degree(b, X);
            return misc_1.lessp(a, d) ? d : a;
        }, defs_1.Constants.zero);
    }
    return defs_1.Constants.zero;
}
exports.degree = degree;
