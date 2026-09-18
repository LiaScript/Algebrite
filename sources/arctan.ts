import {
  ARCTAN,
  caddr,
  cadr,
  car,
  Constants,
  COS,
  isadd,
  isdouble,
  ismultiply,
  ispower,
  SIN,
  TAN,
  U
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { symbol } from "../runtime/symbol";
import { equal, length } from '../sources/misc';
import { double, integer, rational } from './bignum';
import { denominator } from './denominator';
import { Eval } from './eval';
import { equaln, equalq, isnegativeterm, isZeroAtomOrTensor, realconstant } from './is';
import { add, subtract } from './add';
import { power } from './power';
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

  if (leadsWithMinus(x)) {
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
  // second if catches the other way of saying it, sqrt(3)/3: the whole
  // product, 1/3*3^(1/2)*y is something else
  if (
    (ispower(x) && equaln(cadr(x), 3) && equalq(caddr(x), -1, 2)) ||
    (ismultiply(x) &&
      length(x) === 3 &&
      equalq(cadr(x), 1, 3) &&
      ispower(caddr(x)) &&
      equaln(cadr(caddr(x)), 3) &&
      equalq(caddr(caddr(x)), 1, 2))
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

  // arctan(2-sqrt(3)) -> pi/12, arctan(2+sqrt(3)) -> 5*pi/12
  const sqrt3 = power(integer(3), rational(1, 2));
  for (const [value, twelfths] of [
    [subtract(integer(2), sqrt3), 1],
    [add(integer(2), sqrt3), 5]
  ] as [U, number][]) {
    if (equal(x, value)) {
      return multiply(rational(twelfths, 12), Constants.Pi());
    }
    if (equal(x, negate(value))) {
      return multiply(rational(-twelfths, 12), Constants.Pi());
    }
  }

  return makeList(symbol(ARCTAN), x);
}

// arctan is odd, so a minus sign can come out. A sum starts with its
// constant: -1+2*x stays as it is, the sign of the first term only counts
// when the first term with a variable is negative too (-1-x, -a+b).
function leadsWithMinus(x: U): boolean {
  if (!isadd(x)) {
    return isnegativeterm(x);
  }
  const terms = x.tail();
  const variable = terms.find((t) => isNaN(realconstant(t)));
  return isnegativeterm(terms[0]) && (!variable || isnegativeterm(variable));
}

// arctan(tan(u)) = u - k pi, which lies in [-pi/2, pi/2]; only decidable
// when u is a real constant (arctan(tan(x)) is not x), else null
function arctanOfTan(u: U): U | null {
  const k = Math.round(realconstant(u) / Math.PI);
  return isNaN(k) ? null : subtract(u, multiply(integer(k), Constants.Pi()));
}
