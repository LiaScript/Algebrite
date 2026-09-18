import {
  ARCCOS,
  cadr,
  car,
  Constants,
  COS,
  defs,
  isdouble,
  isrational,
  PI,
  U
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { symbol } from "../runtime/symbol";
import { double, integer, nativeInt, rational } from './bignum';
import { Eval } from './eval';
import {
  isminusoneoversqrttwo,
  isMinusSqrtThreeOverTwo,
  isoneoversqrttwo,
  isSqrtThreeOverTwo,
  realconstant
} from './is';
import { makeList } from './list';
import { specialSineAngle } from './sin';
import { divide, multiply, negate } from './multiply';
import { subtract } from './add';
import { requireDimensionless } from './quantity';

/* arccos =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------
Returns the inverse cosine of x.

*/
export function Eval_arccos(x: U) {
  return arccos(requireDimensionless(Eval(cadr(x)), 'arccos'));
}

function arccos(x: U): U {
  // arccos(cos(u)) = |u - 2 k pi|, which lies in [0, pi];
  // only decidable when u is a real constant, arccos(cos(x)) is not x
  if (car(x) === symbol(COS)) {
    const d = realconstant(cadr(x));
    if (isNaN(d)) {
      return makeList(symbol(ARCCOS), x);
    }
    const k = Math.round(d / (2 * Math.PI));
    const v = subtract(cadr(x), multiply(integer(2 * k), Constants.Pi()));
    return d - 2 * k * Math.PI < 0 ? negate(v) : v;
  }

  if (isdouble(x)) {
    if (Math.abs(x.d) > 1) {
      stop('arccos function argument is not in the interval [-1,1]');
    }
    return double(Math.acos(x.d));
  }

  // if x == 1/sqrt(2) then return 1/4*pi (45 degrees)
  if (isoneoversqrttwo(x)) {
    return defs.evaluatingAsFloats
      ? double(Math.PI / 4.0)
      : multiply(rational(1, 4), symbol(PI));
  }

  // if x == -1/sqrt(2) then return 3/4*pi (135 degrees)
  if (isminusoneoversqrttwo(x)) {
    return defs.evaluatingAsFloats
      ? double((Math.PI * 3.0) / 4.0)
      : multiply(rational(3, 4), symbol(PI));
  }

  // if x == sqrt(3)/2 then return 1/6*pi (30 degrees)
  if (isSqrtThreeOverTwo(x)) {
    return defs.evaluatingAsFloats
      ? double(Math.PI / 6.0)
      : multiply(rational(1, 6), symbol(PI));
  }

  // if x == -sqrt(3)/2 then return 5/6*pi (150 degrees)
  if (isMinusSqrtThreeOverTwo(x)) {
    return defs.evaluatingAsFloats
      ? double((5.0 * Math.PI) / 6.0)
      : multiply(rational(5, 6), symbol(PI));
  }

  // arccos of the special sines: 90 degrees minus the arcsin
  const degrees = specialSineAngle(x);
  if (degrees !== undefined) {
    return multiply(divide(integer(90 - degrees), integer(180)), symbol(PI));
  }

  if (!isrational(x)) {
    return makeList(symbol(ARCCOS), x);
  }

  const n = nativeInt(multiply(x, integer(2)));
  switch (n) {
    case -2:
      return Constants.Pi();
    case -1:
      return defs.evaluatingAsFloats
        ? double((Math.PI * 2.0) / 3.0)
        : multiply(rational(2, 3), symbol(PI));
    case 0:
      return defs.evaluatingAsFloats
        ? double(Math.PI / 2.0)
        : multiply(rational(1, 2), symbol(PI));
    case 1:
      return defs.evaluatingAsFloats
        ? double(Math.PI / 3.0)
        : multiply(rational(1, 3), symbol(PI));
    case 2:
      return Constants.Zero();
    default:
      return makeList(symbol(ARCCOS), x);
  }
}
