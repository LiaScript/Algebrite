import { allSymbolsReal } from './assume';
import { cadr, CONJ, Constants, iscons, ispower, istensor, U } from '../runtime/defs';
import { Find } from '../runtime/find';
import { clockform } from './clock';
import { Eval } from './eval';
import { isminusone } from './is';
import { negate } from './multiply';
import { polar } from './polar';
import { subst } from './subst';
import { makeList } from './list';
import { symbol } from '../runtime/symbol';
import { mapQuantity } from './quantity';

/* conj =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
z

General description
-------------------
Returns the complex conjugate of z.

*/
export function Eval_conj(p1: U) {
  return conj(Eval(cadr(p1)));
}

// conjugate of an evaluated expression
export function conj(p1: U): U {
  // Symbols are real, so only powers of -1 (i is (-1)^(1/2)) are complex.
  // Without any, the value is real: going through polar would lose the
  // sign, since arg() assumes symbols positive (conj(a-b) gave abs(a-b)).
  if (!hasPowerOfMinusOne(p1)) {
    return allSymbolsReal(p1) ? p1 : makeList(symbol(CONJ), p1);
  }
  if (!Find(p1, Constants.imaginaryunit)) {
    // example: (-1)^(1/3)
    return clockform(conjugate(polar(p1)));
  } else {
    return conjugate(p1);
  }
}

function hasPowerOfMinusOne(p: U): boolean {
  if (ispower(p) && isminusone(cadr(p))) {
    return true;
  }
  if (istensor(p)) {
    return p.tensor.elem.some(hasPowerOfMinusOne);
  }
  return iscons(p) && p.tail().some(hasPowerOfMinusOne);
}

// careful is you pass this one an expression with
// i (instead of (-1)^(1/2)) then this doesn't work!
export function conjugate(p1: U): U {
  const q = mapQuantity(p1, conjugate);
  if (q) {
    return q;
  }

  // flipping the sign of i conjugates only when the symbols are real
  if (!allSymbolsReal(p1)) {
    return makeList(symbol(CONJ), p1);
  }
  return Eval(
    subst(p1, Constants.imaginaryunit, negate(Constants.imaginaryunit))
  );
}
