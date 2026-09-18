import { cadddr, caddr, cadr, Constants, NIL, U } from '../runtime/defs';
import { symbol } from '../runtime/symbol';
import { coeff } from './coeff';
import { checkpoly } from './degree';
import { determinant } from './det';
import { Eval } from './eval';
import { guess } from './guess';
import { isZeroAtomOrTensor } from './is';

/* resultant =====================================================================

Parameters
----------
f,g,x

General description
-------------------
Returns the resultant of the polynomials f and g with respect to x: an
expression without x that is zero exactly when f and g have a common root
in x. The x argument can be omitted for polynomials in x.

  resultant(x^2+y^2-1,x-y,y)
  > 2*x^2-1

*/
export function Eval_resultant(p1: U) {
  const f = Eval(cadr(p1));
  const g = Eval(caddr(p1));
  const arg = Eval(cadddr(p1));
  const x = arg === symbol(NIL) ? guess(f) : arg;
  checkpoly('resultant', f, x);
  checkpoly('resultant', g, x);
  return resultant(f, g, x);
}

// Determinant of the Sylvester matrix: deg g shifted rows of the
// coefficients of f, then deg f shifted rows of those of g.
// ponytail: determinant() expands over all permutations, O(n!) in
// deg f + deg g; switch to Bareiss elimination if large degrees matter.
export function resultant(f: U, g: U, x: U): U {
  if (isZeroAtomOrTensor(f) || isZeroAtomOrTensor(g)) {
    return Constants.zero;
  }
  const a = coeff(f, x).reverse();
  const b = coeff(g, x).reverse();
  const m = a.length - 1;
  const n = b.length - 1;
  const size = m + n;
  const elems: U[] = [];
  for (let i = 0; i < size; i++) {
    const [c, shift] = i < n ? [a, i] : [b, i - n];
    for (let j = 0; j < size; j++) {
      elems.push(c[j - shift] ?? Constants.zero);
    }
  }
  return determinant(elems, size);
}
