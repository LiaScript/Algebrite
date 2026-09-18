import { allSymbolsReal } from './assume';
import { makeList } from './list';
import { symbol } from '../runtime/symbol';
import { cadr, REAL, U } from '../runtime/defs';
import { add } from './add';
import { integer } from './bignum';
import { conjugate } from './conj';
import { Eval } from './eval';
import { divide } from './multiply';
import { rect } from './rect';

/*
 Returns the real part of complex z

  z    real(z)
  -    -------

  a + i b    a

  exp(i a)  cos(a)
*/
export function Eval_real(p1: U) {
  return real(Eval(cadr(p1)));
}

export function real(p: U): U {
  // with a symbol not known to be real, a + i b can't be separated
  if (!allSymbolsReal(p)) {
    return makeList(symbol(REAL), p);
  }
  const p1 = rect(p);
  return divide(add(p1, conjugate(p1)), integer(2));
}
