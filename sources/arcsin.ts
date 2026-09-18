import {
  ARCSIN,
  cadr,
  car,
  Constants,
  defs,
  isdouble,
  isrational,
  PI,
  SIN,
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

/* arcsin =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
x

General description
-------------------
Returns the inverse sine of x.

*/
export function Eval_arcsin(x: U) {
    return arcsin(requireDimensionless(Eval(cadr(x)), 'arcsin'));
}

function arcsin(x: U): U {
  // arcsin(sin(u)) = (-1)^k (u - k pi), which lies in [-pi/2, pi/2];
  // only decidable when u is a real constant, arcsin(sin(x)) is not x
  if (car(x) === symbol(SIN)) {
    const k = Math.round(realconstant(cadr(x)) / Math.PI);
    if (isNaN(k)) {
      return makeList(symbol(ARCSIN), x);
    }
    const v = subtract(cadr(x), multiply(integer(k), Constants.Pi()));
    return k % 2 ? negate(v) : v;
  }

  if (isdouble(x)) {
    if (Math.abs(x.d) > 1) {
      stop('arcsin function argument is not in the interval [-1,1]');
    }
    return double(Math.asin(x.d));
  }

  // if x == 1/sqrt(2) then return 1/4*pi (45 degrees)
  if (isoneoversqrttwo(x)) {
    return multiply(rational(1, 4), symbol(PI));
  }

  // if x == -1/sqrt(2) then return -1/4*pi (-45 degrees)
  if (isminusoneoversqrttwo(x)) {
    return defs.evaluatingAsFloats
      ? double(-Math.PI / 4.0)
      : multiply(rational(-1, 4), symbol(PI));
  }

  // if x == sqrt(3)/2 then return 1/3*pi (60 degrees)
  if (isSqrtThreeOverTwo(x)) {
    return defs.evaluatingAsFloats
      ? double(Math.PI / 3.0)
      : multiply(rational(1, 3), symbol(PI));
  }

  // if x == -sqrt(3)/2 then return -1/3*pi (-60 degrees)
  if (isMinusSqrtThreeOverTwo(x)) {
    return defs.evaluatingAsFloats
      ? double(-Math.PI / 3.0)
      : multiply(rational(-1, 3), symbol(PI));
  }

  // arcsin((6^(1/2)-2^(1/2))/4) = pi/12 and the like
  const degrees = specialSineAngle(x);
  if (degrees !== undefined) {
    return multiply(divide(integer(degrees), integer(180)), symbol(PI));
  }

  if (!isrational(x)) {
    return makeList(symbol(ARCSIN), x);
  }

  const n = nativeInt(multiply(x, integer(2)));
  switch (n) {
    case -2:
      return defs.evaluatingAsFloats
        ? double(-Math.PI / 2.0)
        : multiply(rational(-1, 2), symbol(PI));
    case -1:
      return defs.evaluatingAsFloats
        ? double(-Math.PI / 6.0)
        : multiply(rational(-1, 6), symbol(PI));
    case 0:
      return Constants.Zero();
    case 1:
      return defs.evaluatingAsFloats
        ? double(Math.PI / 6.0)
        : multiply(rational(1, 6), symbol(PI));
    case 2:
      return defs.evaluatingAsFloats
        ? double(Math.PI / 2.0)
        : multiply(rational(1, 2), symbol(PI));
    default:
      return makeList(symbol(ARCSIN), x);
  }
}
