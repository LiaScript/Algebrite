import { facts } from './assume';
import {
  cadr,
  Constants,
  isdouble,
  isrational,
  MSIGN,
  MZERO,
  SGN,
  U
} from '../runtime/defs';
import { symbol } from "../runtime/symbol";
import { absval } from './abs';
import { Eval } from './eval';
import { iscomplexnumber, isnegativeterm } from './is';
import { makeList } from './list';
import { mmul } from './mmul';
import { divide, multiply, negate } from './multiply';
import { mapQuantity } from './quantity';

//-----------------------------------------------------------------------------
//
//  Author : philippe.billet@noos.fr
//
//  sgn sign function
//
//
//-----------------------------------------------------------------------------
export function Eval_sgn(p1: U) {
  const arg = Eval(cadr(p1));
  return mapQuantity(arg, sgn, false) || sgn(arg);
}

export function sgn(X: U): U {
  if (isdouble(X)) {
    if (X.d > 0) {
      return Constants.one;
    }
    if (X.d === 0) {
      return Constants.zero;
    }
    return Constants.negOne;
  }

  if (isrational(X)) {
    if (MSIGN(mmul(X.q.a, X.q.b)) === -1) {
      return Constants.negOne;
    }
    if (MZERO(mmul(X.q.a, X.q.b))) {
      return Constants.zero;
    }
    return Constants.one;
  }

  if (iscomplexnumber(X)) {
    // sgn(z) = z/|z| for complex z
    return divide(X, absval(X));
  }

  const known = facts(X);
  if (known.positive || known.negative || known.zero) {
    return known.positive ? Constants.one : known.negative ? Constants.negOne : Constants.zero;
  }

  if (isnegativeterm(X)) {
    return multiply(makeList(symbol(SGN), negate(X)), Constants.negOne);
  }

  return makeList(symbol(SGN), X);
}
