import { isInteger } from './assume';
import {
  cadr,
  Constants,
  FLOOR,
  isdouble,
  isNumericAtom,
  Num,
  U
} from '../runtime/defs';
import { symbol } from "../runtime/symbol";
import { add } from './add';
import { double } from './bignum';
import { Eval } from './eval';
import { isinteger, isnegativenumber } from './is';
import { makeList } from './list';
import { mdiv } from './mmul';
import { mapQuantity } from './quantity';

export function Eval_floor(p1: U) {
  const arg = Eval(cadr(p1));
  return mapQuantity(arg, yfloor) || yfloor(arg);
}

export function yfloor(p1: U): U {
  return yyfloor(p1);
}

function yyfloor(p1: U): U {
  if (!isNumericAtom(p1)) {
    // an integer by the assumptions, e.g. n or n^2+1 for integer n
    return isInteger(p1) ? p1 : makeList(symbol(FLOOR), p1);
  }

  if (isdouble(p1)) {
    return double(Math.floor(p1.d));
  }

  if (isinteger(p1)) {
    return p1;
  }

  let p3: U = new Num(mdiv(p1.q.a, p1.q.b));

  if (isnegativenumber(p1)) {
    p3 = add(p3, Constants.negOne);
  }
  return p3;
}
