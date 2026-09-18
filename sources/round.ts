import {
  cadr,
  isdouble,
  isNumericAtom,
  ROUND,
  U
} from '../runtime/defs';
import { symbol } from "../runtime/symbol";
import { add } from './add';
import { double, rational } from './bignum';
import { Eval } from './eval';
import { yfloor } from './floor';
import { isinteger } from './is';
import { makeList } from './list';
import { mapQuantity } from './quantity';

export function Eval_round(p1: U) {
  const arg = Eval(cadr(p1));
  return mapQuantity(arg, yround) || yround(arg);
}

function yround(p1: U): U {
  if (!isNumericAtom(p1)) {
    return makeList(symbol(ROUND), p1);
  }

  if (isdouble(p1)) {
    return double(Math.round(p1.d));
  }

  if (isinteger(p1)) {
    return p1;
  }

  // exact, like Math.round: floor(x + 1/2)
  return yfloor(add(p1, rational(1, 2)));
}
