import {
  ARCCOSH,
  cadr,
  car,
  Constants,
  COSH,
  isdouble,
  U
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { symbol } from "../runtime/symbol";
import { double } from './bignum';
import { Eval } from './eval';
import { isplusone, realconstant } from './is';
import { negate } from './multiply';
import { makeList } from './list';
import { requireDimensionless } from './quantity';

/* arccosh =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------
Returns the inverse hyperbolic cosine of x.

*/
export function Eval_arccosh(x: U) {
  return arccosh(requireDimensionless(Eval(cadr(x)), 'arccosh'));
}

function arccosh(x: U): U {
  // arccosh(cosh(u)) = |u| for real u; only decidable when u is a real
  // constant, arccosh(cosh(x)) is not x for x < 0
  if (car(x) === symbol(COSH)) {
    const d = realconstant(cadr(x));
    if (isNaN(d)) {
      return makeList(symbol(ARCCOSH), x);
    }
    return d < 0 ? negate(cadr(x)) : cadr(x);
  }

  if (isdouble(x)) {
    let { d } = x;
    if (d < 1.0) {
      stop('arccosh function argument is less than 1.0');
    }
    d = Math.log(d + Math.sqrt(d * d - 1.0));
    return double(d);
  }

  if (isplusone(x)) {
    return Constants.zero;
  }

  return makeList(symbol(ARCCOSH), x);
}
