import {
  cadr,
  Constants,
  DIRAC,
  isadd,
  isdouble,
  isrational,
  MZERO,
  U
} from '../runtime/defs';
import { symbol } from "../runtime/symbol";
import { Eval } from './eval';
import { isnegativeterm } from './is';
import { makeList } from './list';
import { mmul } from './mmul';
import { negate } from './multiply';
import { checkArgCount } from './misc';

//-----------------------------------------------------------------------------
//
//  Author : philippe.billet@noos.fr
//
//  Dirac function dirac(x)
//  dirac(-x)=dirac(x)
//  dirac(b-a)=dirac(a-b)
//-----------------------------------------------------------------------------
export function Eval_dirac(p1: U) {
  checkArgCount(p1, 1);
  return dirac(Eval(cadr(p1)));
}

export function dirac(p1: U): U {
  return ydirac(p1);
}

// dirac(0) has no value, it stays unevaluated. dirac(x^n) is not
// dirac(x) (the scaling rule would divide by the vanishing n*x^(n-1)).
function ydirac(p1: U): U {
  if (isdouble(p1)) {
    if (p1.d === 0) {
      return makeList(symbol(DIRAC), p1);
    }
    return Constants.zero;
  }

  if (isrational(p1)) {
    if (MZERO(mmul(p1.q.a, p1.q.b))) {
      return makeList(symbol(DIRAC), p1);
    }
    return Constants.zero;
  }

  if (isnegativeterm(p1)) {
    return makeList(symbol(DIRAC), negate(p1));
  }

  if (isnegativeterm(p1) || (isadd(p1) && isnegativeterm(cadr(p1)))) {
    p1 = negate(p1);
  }

  return makeList(symbol(DIRAC), p1);
}
