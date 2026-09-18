import { alloc_tensor } from '../runtime/alloc';
import {
  AT,
  caddr,
  car,
  cdr,
  DEFINT,
  DERIVATIVE,
  iscons,
  istensor,
  NIL,
  PRODUCT,
  SUM,
  U,
  Cons,
} from '../runtime/defs';
import { equal } from '../sources/misc';
import { canRename, makeAt } from './at';
import { makeList } from './list';
import { check_tensor_dimensions } from './tensor';
import {symbol} from "../runtime/symbol";

/*
  Substitute new expr for old expr in expr.

  Input:  expr     expr
          oldExpr  old expr
          newExpr  new expr

  Output:  Result
*/
export function subst(expr: U, oldExpr: U, newExpr: U): U {
  if (oldExpr === symbol(NIL) || newExpr === symbol(NIL)) {
    return expr;
  }
  if (istensor(expr)) {
    const p4 = alloc_tensor(expr.tensor.nelem);
    p4.tensor.ndim = expr.tensor.ndim;
    p4.tensor.dim = Array.from(expr.tensor.dim);
    p4.tensor.elem = expr.tensor.elem.map((el) => {
      const result = subst(el, oldExpr, newExpr);
      check_tensor_dimensions(p4);
      return result;
    });
    return p4;
  }
  if (equal(expr, oldExpr)) {
    return newExpr;
  }
  if (iscons(expr)) {
    const bound = substBound(expr, oldExpr, newExpr);
    if (bound !== undefined) {
      return bound;
    }
    return new Cons(
      subst(car(expr), oldExpr, newExpr),
      subst(cdr(expr), oldExpr, newExpr)
    );
  }

  return expr;
}

// Nodes where oldExpr is a bound variable, else undefined:
// - d(f,x) at x = value is at(d(f,x),x,value), y'(value) for a function
//   of x alone; substituting d(f,x) itself would differentiate with
//   respect to the value. A free symbol just renames the variable.
// - at(f,x,v), sum/product(f,k,a,b), defint(f,x,a,b,...): only the value
//   or the bounds are substituted, f and the variable stay.
function substBound(expr: Cons, oldExpr: U, newExpr: U): U | undefined {
  const head = car(expr);
  const sub = (p: U) => subst(p, oldExpr, newExpr);
  if (head === symbol(DERIVATIVE) && equal(caddr(expr), oldExpr)) {
    return canRename(expr, newExpr) ? undefined : makeAt(expr, oldExpr, newExpr);
  }
  if (
    (head === symbol(AT) || head === symbol(SUM) || head === symbol(PRODUCT)) &&
    equal(caddr(expr), oldExpr)
  ) {
    const [f, x, ...rest] = expr.tail();
    return makeList(head, f, x, ...rest.map(sub));
  }
  if (head === symbol(DEFINT)) {
    // defint(f, x, a, b, y, c, d, ...)
    const [f, ...ranges] = expr.tail();
    const vars = ranges.filter((_, i) => i % 3 === 0);
    if (vars.some((v) => equal(v, oldExpr))) {
      return makeList(head, f, ...ranges.map((r, i) => (i % 3 === 0 ? r : sub(r))));
    }
  }
  return undefined;
}
