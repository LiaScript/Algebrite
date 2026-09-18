"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subst = void 0;
const alloc_1 = require("../runtime/alloc");
const defs_1 = require("../runtime/defs");
const misc_1 = require("../sources/misc");
const at_1 = require("./at");
const list_1 = require("./list");
const tensor_1 = require("./tensor");
const symbol_1 = require("../runtime/symbol");
/*
  Substitute new expr for old expr in expr.

  Input:  expr     expr
          oldExpr  old expr
          newExpr  new expr

  Output:  Result
*/
function subst(expr, oldExpr, newExpr) {
    if (oldExpr === symbol_1.symbol(defs_1.NIL) || newExpr === symbol_1.symbol(defs_1.NIL)) {
        return expr;
    }
    if (defs_1.istensor(expr)) {
        const p4 = alloc_1.alloc_tensor(expr.tensor.nelem);
        p4.tensor.ndim = expr.tensor.ndim;
        p4.tensor.dim = Array.from(expr.tensor.dim);
        p4.tensor.elem = expr.tensor.elem.map((el) => {
            const result = subst(el, oldExpr, newExpr);
            tensor_1.check_tensor_dimensions(p4);
            return result;
        });
        return p4;
    }
    if (misc_1.equal(expr, oldExpr)) {
        return newExpr;
    }
    if (defs_1.iscons(expr)) {
        const bound = substBound(expr, oldExpr, newExpr);
        if (bound !== undefined) {
            return bound;
        }
        return new defs_1.Cons(subst(defs_1.car(expr), oldExpr, newExpr), subst(defs_1.cdr(expr), oldExpr, newExpr));
    }
    return expr;
}
exports.subst = subst;
// Nodes where oldExpr is a bound variable, else undefined:
// - d(f,x) at x = value is at(d(f,x),x,value), y'(value) for a function
//   of x alone; substituting d(f,x) itself would differentiate with
//   respect to the value. A free symbol just renames the variable.
// - at(f,x,v), sum/product(f,k,a,b), defint(f,x,a,b,...): only the value
//   or the bounds are substituted, f and the variable stay.
function substBound(expr, oldExpr, newExpr) {
    const head = defs_1.car(expr);
    const sub = (p) => subst(p, oldExpr, newExpr);
    if (head === symbol_1.symbol(defs_1.DERIVATIVE) && misc_1.equal(defs_1.caddr(expr), oldExpr)) {
        return at_1.canRename(expr, newExpr) ? undefined : at_1.makeAt(expr, oldExpr, newExpr);
    }
    if ((head === symbol_1.symbol(defs_1.AT) || head === symbol_1.symbol(defs_1.SUM) || head === symbol_1.symbol(defs_1.PRODUCT)) &&
        misc_1.equal(defs_1.caddr(expr), oldExpr)) {
        const [f, x, ...rest] = expr.tail();
        return list_1.makeList(head, f, x, ...rest.map(sub));
    }
    if (head === symbol_1.symbol(defs_1.DEFINT)) {
        // defint(f, x, a, b, y, c, d, ...)
        const [f, ...ranges] = expr.tail();
        const vars = ranges.filter((_, i) => i % 3 === 0);
        if (vars.some((v) => misc_1.equal(v, oldExpr))) {
            return list_1.makeList(head, f, ...ranges.map((r, i) => (i % 3 === 0 ? r : sub(r))));
        }
    }
    return undefined;
}
