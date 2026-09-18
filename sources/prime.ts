import {
  cadr,
  isNumericAtom,
  MAXPRIMETAB,
  PRIME,
  primetab,
  U,
} from '../runtime/defs';
import { symbol } from '../runtime/symbol';
import { isinteger } from './is';
import { makeList } from './list';
import { stop } from '../runtime/run';
import { integer, nativeInt } from './bignum';
import { Eval } from './eval';

//-----------------------------------------------------------------------------
//
//  Look up the nth prime
//
//  Input:    n (0 < n < 10001)
//
//  Output:    nth prime
//
//-----------------------------------------------------------------------------
export function Eval_prime(p1: U) {
  return prime(Eval(cadr(p1)));
}

function prime(p1: U) {
  if (!isinteger(p1)) {
    if (isNumericAtom(p1)) {
      stop('prime: Argument out of range.');
    }
    return makeList(symbol(PRIME), p1);
  }
  let n = nativeInt(p1);
  if (n < 1 || n > MAXPRIMETAB) {
    stop('prime: Argument out of range.');
  }
  n = primetab[n - 1];
  return integer(n);
}
