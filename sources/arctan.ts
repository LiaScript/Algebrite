import {
  ARCTAN,
  caddr,
  cadr,
  car,
  cdr,
  Constants,
  COS,
  isdouble,
  ismultiply,
  ispower,
  POWER,
  SIN,
  TAN,
  U
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { symbol } from "../runtime/symbol";
import { equal } from '../sources/misc';
import { double, integer, rational } from './bignum';
import { denominator } from './denominator';
import { Eval } from './eval';
import { equaln, equalq, isnegative, isZeroAtomOrTensor, realconstant } from './is';
import { subtract } from './add';
import { makeList } from './list';
import { multiply, negate } from './multiply';
import { numerator } from './numerator';
import { requireDimensionless } from './quantity';

/* arctan =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------
Returns the inverse tangent of x.

*/
export function Eval_arctan(x: U) {
    return arctan(requireDimensionless(Eval(cadr(x)), 'arctan'));
}

export function arctan(x: U): U {
  if (car(x) === symbol(TAN)) {
    return arctanOfTan(cadr(x)) || makeList(symbol(ARCTAN), x);
  }

  if (isdouble(x)) {
    return double(Math.atan(x.d));
  }

  if (isZeroAtomOrTensor(x)) {
    return Constants.zero;
  }

  if (isnegative(x)) {
    return negate(arctan(negate(x)));
  }

  // arctan(sin(a) / cos(a)) ?
  if (Find(x, symbol(SIN)) && Find(x, symbol(COS))) {
    const p2 = numerator(x);
    const p3 = denominator(x);
    if (
      car(p2) === symbol(SIN) &&
      car(p3) === symbol(COS) &&
      equal(cadr(p2), cadr(p3))
    ) {
      return arctanOfTan(cadr(p2)) || makeList(symbol(ARCTAN), x);
    }
  }

  // arctan(1/sqrt(3)) -> pi/6
  // second if catches the other way of saying it, sqrt(3)/3
  if (
    (ispower(x) && equaln(cadr(x), 3) && equalq(caddr(x), -1, 2)) ||
    (ismultiply(x) &&
      equalq(car(cdr(x)), 1, 3) &&
      car(car(cdr(cdr(x)))) === symbol(POWER) &&
      equaln(car(cdr(car(cdr(cdr(x))))), 3) &&
      equalq(car(cdr(cdr(car(cdr(cdr(x)))))), 1, 2))
  ) {
    return multiply(rational(1, 6), Constants.Pi());
  }

  // arctan(1) -> pi/4
  if (equaln(x, 1)) {
    return multiply(rational(1, 4), Constants.Pi());
  }

  // arctan(sqrt(3)) -> pi/3
  if (ispower(x) && equaln(cadr(x), 3) && equalq(caddr(x), 1, 2)) {
    return multiply(rational(1, 3), Constants.Pi());
  }

  return makeList(symbol(ARCTAN), x);
}

// arctan(tan(u)) = u - k pi, which lies in [-pi/2, pi/2]; only decidable
// when u is a real constant (arctan(tan(x)) is not x), else null
function arctanOfTan(u: U): U | null {
  const k = Math.round(realconstant(u) / Math.PI);
  return isNaN(k) ? null : subtract(u, multiply(integer(k), Constants.Pi()));
}
