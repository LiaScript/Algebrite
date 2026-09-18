"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.primeCall = exports.primeName = exports.primeOrder = exports.primeVariable = exports.makeAt = exports.canRename = exports.at = exports.Eval_at = void 0;
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const symbol_1 = require("../runtime/symbol");
const eval_1 = require("./eval");
const list_1 = require("./list");
const subst_1 = require("./subst");
/* at =====================================================================

at(expr, x, value) is expr at x = value, the substitution done after
differentiating: at(d(y(t),t),t,0) is y'(0).

It stays unevaluated while expr has a derivative with respect to x that
can't be computed (an unknown function). For an unknown function of the
variable alone, d(...d(y(x),x)...,x), it prints as y'(value), y''(value),
..., and y'(value) can be typed in.

*/
function Eval_at(p1) {
    const x = defs_1.issymbol(defs_1.caddr(p1)) ? defs_1.caddr(p1) : eval_1.Eval(defs_1.caddr(p1));
    return at(eval_1.Eval(defs_1.cadr(p1)), x, eval_1.Eval(defs_1.cadddr(p1)));
}
exports.Eval_at = Eval_at;
function at(expr, x, value) {
    // subst turns each derivative with respect to x into an at(); for expr
    // itself that must not be evaluated again, it would come back here
    if (defs_1.car(expr) === symbol_1.symbol(defs_1.DERIVATIVE) && defs_1.caddr(expr) === x) {
        return makeAt(expr, x, value);
    }
    return eval_1.Eval(subst_1.subst(expr, x, value));
}
exports.at = at;
// Substituting a free symbol not already in expr just renames the
// variable: at(d(y(t),t),t,a) is d(y(a),a).
function canRename(expr, value) {
    return symbol_1.is_usr_symbol(value) && !find_1.Find(expr, value);
}
exports.canRename = canRename;
// The unevaluated at(), in canonical form: primes use a fixed variable, so
// y'(0) from subst, from laplace and typed in are the same expression.
function makeAt(expr, x, value) {
    if (canRename(expr, value)) {
        return eval_1.Eval(subst_1.subst(expr, x, value));
    }
    if (primeOrder(expr, x) > 0 && x !== primeVariable()) {
        return makeAt(subst_1.subst(expr, x, primeVariable()), primeVariable(), value);
    }
    return list_1.makeList(symbol_1.symbol(defs_1.AT), expr, x, value);
}
exports.makeAt = makeAt;
// placeholder variable of the prime notation, the parser can't produce it
function primeVariable() {
    return symbol_1.usr_symbol('$x');
}
exports.primeVariable = primeVariable;
// n for d(...d(y(x),x)...,x) with y a function of x alone, else 0
function primeOrder(expr, x) {
    let n = 0;
    while (defs_1.car(expr) === symbol_1.symbol(defs_1.DERIVATIVE) && defs_1.caddr(expr) === x) {
        expr = defs_1.cadr(expr);
        n++;
    }
    const isCallOfXAlone = defs_1.iscons(expr) &&
        defs_1.issymbol(defs_1.car(expr)) &&
        defs_1.cadr(expr) === x &&
        defs_1.cddr(expr) === symbol_1.symbol(defs_1.NIL);
    return isCallOfXAlone ? n : 0;
}
exports.primeOrder = primeOrder;
// "y''(0)" for at(d(d(y(x),x),x),x,0), else null
function primeName(p) {
    if (defs_1.car(p) !== symbol_1.symbol(defs_1.AT)) {
        return null;
    }
    const expr = defs_1.cadr(p);
    const n = primeOrder(expr, defs_1.caddr(p));
    if (n === 0) {
        return null;
    }
    let f = expr;
    while (defs_1.car(f) === symbol_1.symbol(defs_1.DERIVATIVE)) {
        f = defs_1.cadr(f);
    }
    return defs_1.car(f).toString() + "'".repeat(n);
}
exports.primeName = primeName;
// y'(value) typed in: at(d(y(x),x),x,value) with the prime variable
function primeCall(name, order, value) {
    const x = primeVariable();
    let expr = list_1.makeList(symbol_1.usr_symbol(name), x);
    for (let i = 0; i < order; i++) {
        expr = list_1.makeList(symbol_1.symbol(defs_1.DERIVATIVE), expr, x);
    }
    return list_1.makeList(symbol_1.symbol(defs_1.AT), expr, x, value);
}
exports.primeCall = primeCall;
